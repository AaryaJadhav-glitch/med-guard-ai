# 🛡️ Med-Guard AI — Clinical Medication Safety & Interaction Prevention Platform

> **Clinical Decision Support Directive**: Med-Guard AI assists healthcare professionals in identifying potential medication risks before a medicine is prescribed or dispensed. It is a clinical decision-support tool, not an autonomous prescribing system. It does not replace independent clinical judgment, pharmacist review, or official prescribing monographs.

---

## 📋 Table of Contents

1. [Overview & Core Mission](#-overview--core-mission)
2. [Technology Stack](#-technology-stack)
3. [Architecture & Safety Framework](#-architecture--safety-framework)
4. [Database Schema & Row Level Security (RLS)](#-database-schema--row-level-security-rls)
5. [AI Clinical Safety Engine & Prompts](#-ai-clinical-safety-engine--prompts)
6. [Application Routes & Workflow](#-application-routes--workflow)
7. [Environment Variables](#-environment-variables)
8. [Database Setup & Migrations](#-database-setup--migrations)
9. [Running the Application Locally](#-running-the-application-locally)
10. [Automated Testing](#-automated-testing)
11. [Production Deployment Guide](#-production-deployment-guide)

---

## 🎯 Overview & Core Mission

Prescription-related harm—including severe drug-drug interactions, beta-lactam allergy cross-reactivity, and organ-clearance contraindications—remains one of the leading preventable causes of inpatient morbidity and mortality.

**Med-Guard AI** provides a structured, multi-factor clinical evaluation pipeline:
```
Patient Chart → Medical Profile → Existing Medications → New Prescription Entry → AI Multi-Vector Safety Analysis → Risk Stratification → Clinical Review → Prescriber Decision
```

### Risk Stratification Hierarchy:
* **Critical**: Life-threatening risk (e.g. fatal GI bleeding with Warfarin + NSAID, anaphylactic shock from Penicillin cross-reactivity). Immediate intervention required.
* **High**: Clinically major concern (e.g. pre-renal AKI in CKD patients, duplicate therapeutic class toxicity). Requires dosage adjustment or alternative agent.
* **Moderate**: Significant interaction requiring targeted clinical observation or baseline laboratory testing.
* **Low**: Minor or standard monitoring consideration.
* **Informational**: Verification complete; combination aligns with standard prescribing safety parameters.

---

## 💻 Technology Stack

* **Frontend**: React 18, React Router v6, Tailwind CSS, Lucide React Icons
* **Backend**: Node.js v20+, Express.js REST API, Async/Await
* **Database**: Supabase PostgreSQL with UUID primary keys and Row Level Security (RLS)
* **Authentication**: Supabase Authentication (JWT session tokens verified server-side)
* **Artificial Intelligence**: Google Gemini via official `@google/genai` SDK (strictly backend-only)
* **Validation**: Zod (100% schema validation on incoming API requests and AI JSON responses)
* **Security Middleware**: Helmet, CORS, Express Rate Limit, Request Size Limiters

---

## 🧱 Architecture & Safety Framework

```
med-guard-ai/
├── client/                     # React.js Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI, Layout, and Clinical components
│   │   │   ├── ui/             # Buttons, Inputs, Cards, Badges, Modals, Feedbacks
│   │   │   ├── layout/         # AppLayout, Sidebar, Topbar, ProtectedRoute
│   │   │   ├── patients/       # Patient list cards & medical profile modals
│   │   │   └── analysis/       # RiskAlert, RiskSummary, MedicationInputRow
│   │   ├── pages/              # Login, Register, Dashboard, Patients, Analysis, History...
│   │   ├── context/            # AuthContext (Supabase session listener)
│   │   ├── services/           # Authenticated API client
│   │   └── lib/                # Supabase browser client
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express REST API
│   ├── src/
│   │   ├── config/             # Environment & Supabase admin client
│   │   ├── middleware/         # Auth (RLS enforcement), Security (Helmet/CORS), Error
│   │   ├── controllers/        # Patients, Allergies, Conditions, Meds, Analysis, Profile
│   │   ├── routes/             # REST endpoints
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Gemini AI service & Audit logging
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/                  # Automated integration & unit tests
│   └── package.json
│
├── supabase/                   # Supabase Cloud Database Assets
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Complete tables, triggers, indexes, RLS policies
│   ├── scripts/
│   │   └── run-migration.js    # Node.js automated migration runner
│   └── seed.sql                # Clinical demo cases (CKD, Afib, Warfarin, Penicillin allergy)
│
├── .env.example                # Unified environment variable template
├── .gitignore
├── README.md
└── package.json                # Root orchestration scripts
```

---

## 🗄️ Database Schema & Row Level Security (RLS)

All tables strictly enforce **Row Level Security (RLS)** in PostgreSQL:

1. `profiles`: Practitioner details linked to `auth.users(id) ON DELETE CASCADE`.
2. `patients`: Demographic and physiological parameters (`user_id = auth.uid()`).
3. `allergies`: Documented allergens, reactions, and severity ratings (`EXISTS patient.user_id = auth.uid()`).
4. `medical_conditions`: Diagnoses, status (active, managed, resolved), and severity.
5. `medications`: Active and historical medications, doses, frequencies, routes, and prescribers.
6. `analyses`: AI safety evaluation snapshots, overall risk levels, and clinical findings.
7. `analysis_medications`: Relational mapping of all medications screened in each analysis.
8. `audit_logs`: Immutable clinical audit trail recording creation, modification, and evaluation actions.

---

## 🤖 AI Clinical Safety Engine & Prompts

### De-Identification Privacy Pipeline
Before any patient data is transmitted to Google Gemini:
* Full names, residential addresses, contact details, and government identifiers are **strictly stripped**.
* Only age, biological sex, height, weight, documented allergies, active medical conditions, and medications are provided.

### Structured Output Schema
The AI is configured via `responseMimeType: "application/json"` with strict schema enforcement:
```json
{
  "overallRisk": "critical|high|moderate|low|informational",
  "summary": "Clinical evaluation narrative",
  "alerts": [
    {
      "severity": "critical|high|moderate|low|informational",
      "category": "drug_interaction|allergy|contraindication|duplicate_therapy|dose_concern|monitoring|patient_specific",
      "title": "Title of clinical finding",
      "medicationsInvolved": ["Medication Name"],
      "explanation": "Pharmacological mechanism",
      "potentialConcern": "Clinical adverse consequence",
      "recommendedClinicalAction": "Action for clinician consideration",
      "monitoring": ["Parameter to monitor"],
      "possibleAlternatives": [
        {
          "name": "Alternative medication name",
          "reason": "Why clinician may evaluate it",
          "caveats": "Verification caveats"
        }
      ],
      "confidence": 0.95,
      "limitations": ["Data caveats"]
    }
  ],
  "requiresProfessionalReview": true,
  "dataLimitations": ["Limitations list"]
}
```

### Hallucination Protection
All responses are parsed through Zod (`AnalysisResponseSchema.parse`). If any field, severity enum, or structure is invalid, the engine refuses to present malformed output as clinical guidance and safely falls back to verified deterministic rules.

---

## 🌐 Application Routes & Workflow

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Clinician sign-in with Supabase Auth |
| `/register` | Public | Clinician registration with clinical role selection |
| `/` | Protected | Redirects authenticated users to `/dashboard` |
| `/dashboard` | Protected | Clinical metrics, hazard alerts, recent analyses, quick actions |
| `/patients` | Protected | Searchable patient roster with demographic cards |
| `/patients/new` | Protected | Register a new patient record with height/weight/BMI |
| `/patients/:id` | Protected | Complete patient chart: allergies, conditions, existing medications |
| `/patients/:id/edit`| Protected | Edit patient demographics |
| `/medications` | Protected | Global searchable medication directory across all patients |
| `/analysis/new` | Protected | Multi-prescription safety screening workflow with disclaimer |
| `/analysis/:id` | Protected | Detailed archived safety analysis report with print view |
| `/history` | Protected | Analysis audit history with risk-level filtering and search |
| `/profile` | Protected | Manage practitioner credentials and clinical organization |
| `/settings` | Protected | View RLS and AI engine status; load clinical demo scenarios |

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

```env
# Backend Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
# Strictly server-side only for migrations and administrative verification
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DATABASE_URL=postgresql://postgres.your-ref:password@aws-0-region.pooler.supabase.com:6543/postgres

# Google Gemini API Key (Strictly Server-Side Only)
GEMINI_API_KEY=AIzaSy...

# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

---

## 🚀 Database Setup & Migrations

### Option 1: Automated Node.js Migration Runner
If `DATABASE_URL` is set in your `.env`:
```bash
npm run migrate
```

### Option 2: Supabase Web Dashboard
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor**.
3. Open `supabase/migrations/001_initial_schema.sql`, paste the contents into the editor, and click **Run**.
4. (Optional) Open `supabase/seed.sql` and run it to enable sample case functions.

---

## 💻 Running the Application Locally

### 1. Install all dependencies:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Start both Server and Client concurrently:
```bash
npm run dev
```

* **Client UI**: http://localhost:5173
* **Backend API**: http://localhost:5000
* **Health Check**: http://localhost:5000/api/health

---

## 🧪 Automated Testing

Med-Guard AI includes a 15-test suite covering:
* Zod Schema Validation (Patients, Allergies, Medications, Requests, Responses)
* Clinical Context Builder (PII stripping, age calculation)
* Deterministic AI Safety Rule Engine (Warfarin + NSAID bleeding, Penicillin cross-reactivity)
* API Authentication Guards & Security Headers

Run the test suite:
```bash
npm test
```

---

## 🚢 Production Deployment Guide

### Deploying the Backend (e.g. Render, Railway, Fly.io, or AWS):
1. Set the root directory or build command to: `npm --prefix server install`.
2. Start command: `node server/src/server.js`.
3. Configure environment variables (`PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CORS_ORIGIN`).

### Deploying the Frontend (e.g. Vercel, Netlify, Cloudflare Pages):
1. Set root directory to `client`.
2. Build command: `npm run build`.
3. Output directory: `dist`.
4. Configure environment variables (`VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

### Single-Service Unified Deployment:
The Express server is configured to automatically serve the production Vite bundle from `client/dist` when available:
```bash
npm run build
npm start
```
Navigate to `http://localhost:5000` to access the full application.

---

## ⚖️ Clinical Compliance & License
Med-Guard AI is designed in compliance with healthcare software engineering principles. All decision-support recommendations are advisory and require clinical reconciliation by a licensed practitioner.
