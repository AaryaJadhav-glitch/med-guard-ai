import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { AnalysisResponseSchema } from '../schemas/analysis.schema.js';

const SYSTEM_PROMPT = `
You are Med-Guard AI, a clinical medication-safety decision-support assistant.

Your purpose is to analyze structured patient medication information and identify potential medication-related safety concerns.

You are NOT a physician, pharmacist, prescriber, or autonomous clinical decision-maker.

You must never:
- prescribe medication,
- independently discontinue medication,
- independently change a dose,
- claim certainty when evidence is incomplete,
- fabricate clinical facts,
- invent drug interactions,
- invent contraindications,
- invent allergies,
- present AI output as a medical diagnosis,
- instruct a patient to change medication without professional review.

You must:
1. Analyze the provided medication list.
2. Analyze newly proposed medications.
3. Consider documented allergies.
4. Consider documented medical conditions.
5. Identify potential drug-drug interactions.
6. Identify allergy-related risks (including cross-reactivities).
7. Identify contraindication concerns (e.g. renal/hepatic impairment, conditions, age).
8. Identify duplicate therapy (same active ingredient or pharmacological class).
9. Identify relevant dose or administration concerns when sufficient information exists.
10. Identify relevant monitoring considerations (labs, ECG, renal/liver panels, vital signs).
11. Explain each concern clearly with mechanisms.
12. Distinguish confirmed information from uncertainty.
13. State when additional clinical information is required.
14. MANDATORY ALTERNATIVE TABLETS & MEDICATIONS: For EVERY identified interaction, allergy, or contraindication, YOU MUST ALWAYS recommend safe, concrete alternative tablets or medications in "possibleAlternatives" (provide 1 to 3 options with specific tablet names and dosage strengths, e.g. "Acetaminophen 500mg Tablet", "Azithromycin 250mg Tablet", "Linagliptin 5mg Tablet", "Celecoxib 100mg Capsule"). Explain why this tablet formulation avoids the interaction or allergy, and list prescriber caveats.
15. Never claim that an alternative is automatically appropriate. State: "A clinician may consider alternative tablet X depending on the patient's clinical indication and complete medical profile."
16. Return valid structured JSON matching the required schema.

Use conservative clinical reasoning.
When evidence is insufficient, say so explicitly.
Prioritize patient safety above all else.

Every clinically significant warning should include:
- severity: "critical", "high", "moderate", "low", or "informational"
- category: "drug_interaction", "allergy", "contraindication", "duplicate_therapy", "dose_concern", "monitoring", or "patient_specific"
- title: concise clinical finding
- medicationsInvolved: array of medication names involved
- explanation: mechanistic and pharmacological explanation
- potentialConcern: clinical risk (e.g., hemorrhage, acute kidney injury, anaphylaxis)
- recommendedClinicalAction: recommended action for the clinician
- monitoring: array of monitoring parameters
- possibleAlternatives: array of { name: "Specific Tablet / Med with strength", reason: "Why this tablet is safer", caveats: "Prescriber caveats" }
- confidence: number between 0 and 1
- limitations: array of caveats/uncertainties
`;

/**
 * Calculates patient age from Date of Birth string (YYYY-MM-DD)
 */
export function calculateAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

/**
 * Strips PII and builds an isolated clinical context payload for Gemini
 */
export function buildClinicalContext({ patient, allergies, conditions, existingMedications, newMedications, checks }) {
  return {
    patient: {
      age: calculateAge(patient.date_of_birth),
      sex: patient.sex || 'unknown',
      weightKg: patient.weight_kg ? Number(patient.weight_kg) : null,
      heightCm: patient.height_cm ? Number(patient.height_cm) : null,
      allergies: (allergies || []).map((a) => ({
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.severity,
        notes: a.notes
      })),
      conditions: (conditions || []).map((c) => ({
        name: c.condition_name,
        status: c.status,
        severity: c.severity,
        notes: c.notes
      }))
    },
    existingMedications: (existingMedications || []).map((m) => ({
      name: m.name,
      genericName: m.generic_name,
      brandName: m.brand_name,
      strength: m.strength,
      dosageForm: m.dosage_form,
      dose: m.dose,
      frequency: m.frequency,
      route: m.route,
      active: m.active
    })),
    newMedications: (newMedications || []).map((nm) => ({
      name: nm.name,
      strength: nm.strength,
      dose: nm.dose,
      frequency: nm.frequency,
      route: nm.route,
      duration: nm.duration,
      indication: nm.indication,
      notes: nm.notes
    })),
    checks: {
      drugInteractions: checks?.drugInteractions ?? true,
      allergies: checks?.allergies ?? true,
      contraindications: checks?.contraindications ?? true,
      duplicateTherapy: checks?.duplicateTherapy ?? true,
      doseConcerns: checks?.doseConcerns ?? true,
      monitoring: checks?.monitoring ?? true
    }
  };
}

/**
 * Rule-based fallback engine for when GEMINI_API_KEY is not configured or offline.
 * Identifies high-risk clinical pairs to ensure the safety platform provides immediate clinical value.
 */
function runClinicalRulesEngine(context) {
  const alerts = [];
  const existingNames = context.existingMedications.map((m) => (m.name || '').toLowerCase());
  const newNames = context.newMedications.map((m) => (m.name || '').toLowerCase());
  const allMedNames = [...existingNames, ...newNames];
  const conditions = context.patient.conditions.map((c) => (c.name || '').toLowerCase());
  const allergies = context.patient.allergies.map((a) => (a.allergen || '').toLowerCase());

  // 1. Beta-lactam / Penicillin allergy detection
  for (const newMed of context.newMedications) {
    const medLower = newMed.name.toLowerCase();
    const isPenicillinClass = ['amoxicillin', 'ampicillin', 'penicillin', 'augmentin', 'piperacillin'].some((p) => medLower.includes(p));
    const hasPenicillinAllergy = allergies.some((a) => a.includes('penicillin') || a.includes('amoxicillin'));

    if (isPenicillinClass && hasPenicillinAllergy && context.checks.allergies) {
      alerts.push({
        severity: 'critical',
        category: 'allergy',
        title: `Documented Severe Drug-Allergy Conflict: ${newMed.name}`,
        medicationsInvolved: [newMed.name],
        explanation: `${newMed.name} belongs to the penicillin/beta-lactam class. The patient has a documented allergy to Penicillin.`,
        potentialConcern: 'High risk of acute hypersensitivity reaction, IgE-mediated anaphylaxis, or severe cutaneous reactions.',
        recommendedClinicalAction: 'Hold prescription immediately. Consult allergist or select an alternative non-cross-reactive antimicrobial class.',
        monitoring: ['Vital signs (BP, HR, RR, SpO2)', 'Immediate observation for urticaria, bronchospasm, or angioedema'],
        possibleAlternatives: [
          {
            name: 'Azithromycin 250mg Tablet or Doxycycline 100mg Tablet',
            reason: 'Clinician may consider a non-beta-lactam macrolide or tetracycline tablet depending on pathogen sensitivity and infection site.',
            caveats: 'Ensure no secondary macrolide intolerance; verify local antibiogram sensitivity.'
          },
          {
            name: 'Ciprofloxacin 500mg Tablet',
            reason: 'Alternative fluoroquinolone tablet for susceptible gram-negative or urinary tract infections without beta-lactam cross-reactivity.',
            caveats: 'Review baseline QTc and avoid in tendonitis history.'
          }
        ],
        confidence: 0.98,
        limitations: ['Cross-reactivity with cephalosporins depends on side-chain similarity; confirm exact allergy history with patient.']
      });
    }

    // NSAID allergy
    const isNSAID = ['ibuprofen', 'naproxen', 'aspirin', 'ketorolac', 'celecoxib', 'meloxicam'].some((n) => medLower.includes(n));
    const hasNSAIDAllergy = allergies.some((a) => a.includes('aspirin') || a.includes('nsaid'));
    if (isNSAID && hasNSAIDAllergy && context.checks.allergies) {
      alerts.push({
        severity: 'critical',
        category: 'allergy',
        title: `Allergy Conflict: NSAID Class Reaction with ${newMed.name}`,
        medicationsInvolved: [newMed.name],
        explanation: `Patient is documented as allergic to Aspirin/NSAIDs. ${newMed.name} acts via cyclooxygenase inhibition.`,
        potentialConcern: 'Risk of aspirin-exacerbated respiratory disease (AERD), severe bronchospasm, and facial edema.',
        recommendedClinicalAction: 'Avoid NSAID administration. Consider alternative analgesic classes.',
        monitoring: ['Respiratory rate', 'Peak expiratory flow if asthmatic'],
        possibleAlternatives: [
          {
            name: 'Acetaminophen (Paracetamol) 500mg Tablet',
            reason: 'Clinician may consider acetaminophen tablets for mild-to-moderate analgesia without cyclooxygenase-1 cross-reactivity at standard doses.',
            caveats: 'Monitor daily dose maximum (< 2000-3000 mg/day); evaluate hepatic function.'
          },
          {
            name: 'Tramadol 50mg Tablet',
            reason: 'Centrally-acting analgesic tablet for moderate pain where NSAIDs are strictly contraindicated.',
            caveats: 'Assess fall risk, sedation, and check for concurrent serotonergic medications.'
          }
        ],
        confidence: 0.95,
        limitations: ['Some patients with AERD cross-react with high-dose acetaminophen (>1000mg).']
      });
    }

    // 2. Renal contraindications / CKD
    const hasCKD = conditions.some((c) => c.includes('kidney') || c.includes('renal') || c.includes('ckd'));
    if (hasCKD && context.checks.contraindications) {
      if (isNSAID) {
        alerts.push({
          severity: 'high',
          category: 'contraindication',
          title: `Renal Risk: NSAID (${newMed.name}) in Chronic Kidney Disease`,
          medicationsInvolved: [newMed.name],
          explanation: `NSAIDs inhibit renal prostaglandin synthesis, reducing renal blood flow and glomerular filtration rate in pre-existing CKD.`,
          potentialConcern: 'Acute kidney injury (AKI), accelerated decline in eGFR, and fluid retention/hypertension exacerbation.',
          recommendedClinicalAction: 'Avoid chronic NSAIDs in renal impairment. Review baseline eGFR/creatinine before deciding.',
          monitoring: ['Serum creatinine and BUN within 7-14 days', 'Serum potassium', 'Blood pressure monitoring'],
          possibleAlternatives: [
            {
              name: 'Acetaminophen 500mg Tablet',
              reason: 'Clinician may consider acetaminophen tablets as a renal-safe analgesic that does not inhibit renal prostaglandins.',
              caveats: 'Confirm patient has no hepatic impairment; cap dose at 2,000 mg/day in vulnerable patients.'
            },
            {
              name: 'Topical Diclofenac 1% Gel or Lidocaine 5% Patch',
              reason: 'Clinician may evaluate localized non-systemic interventions with minimal renal clearance impact.',
              caveats: 'Verify localized area of musculoskeletal pain.'
            }
          ],
          confidence: 0.92,
          limitations: ['Exact risk depends on baseline eGFR stage and hydration status.']
        });
      }
    }

    // 3. Drug-Drug Interactions: Warfarin + NSAID / Antiplatelet
    const onWarfarin = existingNames.some((m) => m.includes('warfarin') || m.includes('coumadin'));
    if (onWarfarin && isNSAID && context.checks.drugInteractions) {
      alerts.push({
        severity: 'critical',
        category: 'drug_interaction',
        title: `Major Bleeding Hazard: Warfarin + ${newMed.name}`,
        medicationsInvolved: ['Warfarin', newMed.name],
        explanation: `Combining oral anticoagulants with NSAIDs substantially elevates upper GI ulceration risk and impairs platelet aggregation.`,
        potentialConcern: 'Life-threatening gastrointestinal hemorrhage or internal bleeding.',
        recommendedClinicalAction: 'Strongly discourage co-administration. If indispensable, add proton pump inhibitor and monitor INR closely.',
        monitoring: ['INR within 3-5 days', 'Hemoglobin / Hematocrit', 'Stool for occult blood / signs of GI bleeding'],
        possibleAlternatives: [
          {
            name: 'Acetaminophen 500mg Tablet (Short-term)',
            reason: 'Clinician may prescribe acetaminophen tablets for analgesia to avoid antiplatelet and gastric ulceration bleeding hazards.',
            caveats: 'High-dose acetaminophen can still modestly potentiate warfarin; recheck INR after 3-5 days.'
          },
          {
            name: 'Celecoxib 100mg Capsule (with Gastroprotection)',
            reason: 'Selective COX-2 inhibitor tablet associated with lower gastrointestinal ulceration than non-selective NSAIDs.',
            caveats: 'Requires concomitant PPI (Omeprazole 20mg Tablet) and frequent coagulation monitoring.'
          }
        ],
        confidence: 0.96,
        limitations: ['Risk magnitude varies by patient age, INR target, and GI ulcer history.']
      });
    }

    // 4. Drug-Drug Interactions: ACE Inhibitor (Lisinopril) + Potassium / Spironolactone / NSAID
    const onACEi = existingNames.some((m) => m.includes('lisinopril') || m.includes('enalapril') || m.includes('ramipril') || m.includes('losartan'));
    if (onACEi && isNSAID && context.checks.drugInteractions) {
      alerts.push({
        severity: 'high',
        category: 'drug_interaction',
        title: `Hemodynamic Interaction: ACE Inhibitor/ARB + ${newMed.name}`,
        medicationsInvolved: ['ACE Inhibitor / ARB', newMed.name],
        explanation: `Concurrent use impairs both afferent (NSAID) and efferent (ACEi) glomerular arteriole autoregulation, precipitating sudden drops in GFR and hyperkalemia.`,
        potentialConcern: 'Pre-renal acute kidney injury and blunting of antihypertensive effect.',
        recommendedClinicalAction: 'Evaluate non-NSAID analgesics; maintain adequate hydration and track renal function.',
        monitoring: ['Serum potassium', 'Serum creatinine within 1-2 weeks', 'Home blood pressure readings'],
        possibleAlternatives: [
          {
            name: 'Acetaminophen 500mg Tablet',
            reason: 'Renal-sparing analgesic tablet that avoids hemodynamic interference with glomerular filtration and ACE-inhibitors.',
            caveats: 'Verify adequate clinical pain control.'
          },
          {
            name: 'Amlodipine 5mg Tablet (Antihypertensive Adjustment)',
            reason: 'Calcium channel blocker tablet that preserves renal blood flow without prostaglandin-dependent autoregulation conflicts.',
            caveats: 'Monitor for peripheral pedal edema.'
          }
        ],
        confidence: 0.90,
        limitations: ['Intermittent low doses carry less risk than continuous scheduled dosing.']
      });
    }

    // 5. Duplicate Therapy Check
    for (const exMed of context.existingMedications) {
      const exLower = exMed.name.toLowerCase();
      if (context.checks.duplicateTherapy && (exLower === medLower || (exLower.includes('lisinopril') && medLower.includes('enalapril')))) {
        alerts.push({
          severity: 'high',
          category: 'duplicate_therapy',
          title: `Duplicate Therapeutic Agent / Class: ${newMed.name} and ${exMed.name}`,
          medicationsInvolved: [exMed.name, newMed.name],
          explanation: `Both medications belong to the same therapeutic class or represent identical active compounds.`,
          potentialConcern: 'Unintended additive dose toxicity, severe hypotension, or receptor saturation.',
          recommendedClinicalAction: 'Reconcile medication record to clarify if this is a replacement, dose change, or inadvertent duplication.',
          monitoring: ['Blood pressure', 'Target therapeutic parameters'],
          possibleAlternatives: [
            {
              name: `${exMed.name} (Single Daily Tablet Titration)`,
              reason: 'Clinician may consolidate therapy to a single ACE-inhibitor tablet at the target therapeutic dose.',
              caveats: 'Avoid dual-RAS blockade; verify patient tolerability.'
            }
          ],
          confidence: 0.95,
          limitations: ['Verify if provider intended a cross-taper transition.']
        });
      }
    }

    // 6. Monitoring requirement detection
    if (context.checks.monitoring && (medLower.includes('metformin') || medLower.includes('warfarin') || medLower.includes('digoxin') || medLower.includes('lithium'))) {
      alerts.push({
        severity: 'moderate',
        category: 'monitoring',
        title: `Clinical Monitoring Protocol: ${newMed.name}`,
        medicationsInvolved: [newMed.name],
        explanation: `${newMed.name} requires baseline and periodic laboratory monitoring due to a narrow therapeutic index or organ clearance requirements.`,
        potentialConcern: 'Accumulation toxicity or therapeutic failure if biochemical clearance shifts.',
        recommendedClinicalAction: 'Order baseline renal/liver panel and establish recurring laboratory schedule.',
        monitoring: ['eGFR / Serum Creatinine', 'Therapeutic drug levels / target biomarker', 'Hepatic enzymes'],
        possibleAlternatives: [
          {
            name: 'Linagliptin 5mg Tablet',
            reason: 'If renal clearance is impaired, Linagliptin DPP-4 inhibitor tablets require no renal dose adjustment compared to Metformin.',
            caveats: 'Evaluate individual HbA1c target and cardiovascular profile.'
          }
        ],
        confidence: 0.94,
        limitations: ['Frequency depends on clinical stability and concurrent organ dysfunction.']
      });
    }
  }

  // Determine overall risk
  let overallRisk = 'low';
  if (alerts.some((a) => a.severity === 'critical')) {
    overallRisk = 'critical';
  } else if (alerts.some((a) => a.severity === 'high')) {
    overallRisk = 'high';
  } else if (alerts.some((a) => a.severity === 'moderate')) {
    overallRisk = 'moderate';
  } else if (alerts.length > 0) {
    overallRisk = 'low';
  } else {
    overallRisk = 'informational';
    alerts.push({
      severity: 'informational',
      category: 'patient_specific',
      title: 'No Acute Major Interactions Detected',
      medicationsInvolved: context.newMedications.map((m) => m.name),
      explanation: 'Analysis based on available profile did not identify contraindications, severe allergies, or major drug-drug interactions.',
      potentialConcern: 'Standard medication vigilance and patient counseling remain advised.',
      recommendedClinicalAction: 'Proceed with standard prescription workflow and monitor patient clinical response.',
      monitoring: ['Clinical efficacy', 'Patient-reported side effects'],
      possibleAlternatives: [],
      confidence: 0.88,
      limitations: ['Rare idiosyncratic reactions and unrecorded over-the-counter supplements cannot be evaluated without patient disclosure.']
    });
  }

  const summary = `Med-Guard AI evaluated ${context.newMedications.length} new prescription(s) against ${context.existingMedications.length} active medication(s), ${context.patient.allergies.length} allergy record(s), and ${context.patient.conditions.length} clinical condition(s). Overall safety risk is categorized as ${overallRisk.toUpperCase()}. ${alerts.length} clinical safety advisory item(s) generated for healthcare professional review.`;

  return {
    overallRisk,
    summary,
    alerts,
    requiresProfessionalReview: true,
    dataLimitations: [
      'Analysis is conditioned solely upon documented electronic health records in the system.',
      'Herbal remedies, nutritional supplements, and unregistered OTC medications are not captured unless recorded.',
      'Clinical judgment and official manufacturer prescribing guidelines must govern final dispensing decisions.'
    ]
  };
}

/**
 * Executes medication safety analysis via Google Gemini with structured output.
 * Falls back gracefully to clinical rules engine if Gemini API key is unconfigured or unreachable.
 */
export async function analyzeMedicationSafety(payload) {
  const clinicalContext = buildClinicalContext(payload);

  // If GEMINI_API_KEY is not configured or running in automated test suite, run clinical rules engine
  if (!config.geminiApiKey || config.geminiApiKey === 'test-gemini-api-key' || process.env.NODE_ENV === 'test') {
    console.log('[GeminiService] Running in clinical rules evaluation mode (GEMINI_API_KEY not configured or in test).');
    const result = runClinicalRulesEngine(clinicalContext);
    return AnalysisResponseSchema.parse(result);
  }

  const prompt = `
Analyze the following patient medication profile for clinical safety risks:

${JSON.stringify(clinicalContext, null, 2)}

Provide your response strictly in the following JSON structure:
{
  "overallRisk": "critical|high|moderate|low|informational",
  "summary": "Clinical summary of the evaluation findings",
  "alerts": [
    {
      "severity": "critical|high|moderate|low|informational",
      "category": "drug_interaction|allergy|contraindication|duplicate_therapy|dose_concern|monitoring|patient_specific",
      "title": "Concise advisory title",
      "medicationsInvolved": ["medication name"],
      "explanation": "Pharmacological/clinical explanation",
      "potentialConcern": "Potential adverse clinical consequence",
      "recommendedClinicalAction": "Action for the healthcare professional to consider",
      "monitoring": ["Lab/clinical parameter to monitor"],
      "possibleAlternatives": [
        {
          "name": "Alternative medication name",
          "reason": "Why a clinician may consider it",
          "caveats": "Important caveats"
        }
      ],
      "confidence": 0.95,
      "limitations": ["Clinical limitations or uncertainties"]
    }
  ],
  "requiresProfessionalReview": true,
  "dataLimitations": ["Data limitation notes"]
}
`;

  let timeoutId;
  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

    // Implement a 30-second timeout with proper cleanup
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('AI safety analysis timed out after 30 seconds.')), 30000);
      if (timeoutId.unref) timeoutId.unref();
    });

    const callPromise = ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1 // Low temperature for clinical consistency
      }
    });

    const response = await Promise.race([callPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    const responseText = response.text?.trim() || '';

    // Clean JSON block formatting if present
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '');

    const parsedJson = JSON.parse(cleanedJson);

    // Validate strictly with Zod schema
    const validatedResult = AnalysisResponseSchema.parse(parsedJson);
    return validatedResult;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('[GeminiService Error]:', err.message);
    // If Gemini fails due to quota, network, or schema invalidity, fall back to safe rules engine
    // and note the fallback in the clinical advisory limitations
    console.warn('[GeminiService] Falling back to verified deterministic clinical rule engine.');
    const fallbackResult = runClinicalRulesEngine(clinicalContext);
    fallbackResult.dataLimitations.push(`AI engine notification: Rule-based verification active (${err.message.slice(0, 100)}).`);
    return AnalysisResponseSchema.parse(fallbackResult);
  }
}
