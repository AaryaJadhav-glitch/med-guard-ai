export async function getProfile(req, res, next) {
  try {
    let { data: profile, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (!profile) {
      // Auto-create if not yet provisioned
      const { data: newProfile } = await req.supabase
        .from('profiles')
        .insert({
          id: req.user.id,
          full_name: req.user.user_metadata?.full_name || req.user.email.split('@')[0],
          role: 'healthcare_professional'
        })
        .select()
        .single();
      profile = newProfile;
    }

    return res.json({ profile, user: req.user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { fullName, organization } = req.body;

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .update({
        full_name: fullName,
        organization
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ profile });
  } catch (err) {
    next(err);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    // 1. Total patients
    const { count: totalPatients, error: ptError } = await req.supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    // 2. Recent analyses
    const { data: recentAnalyses, error: anError } = await req.supabase
      .from('analyses')
      .select(`
        id,
        patient_id,
        overall_risk,
        summary,
        created_at,
        patients (id, full_name)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(6);

    // 3. Count critical & high alerts from recent analyses
    const { data: allAnalyses } = await req.supabase
      .from('analyses')
      .select('overall_risk')
      .eq('user_id', req.user.id);

    const criticalCount = (allAnalyses || []).filter(a => a.overall_risk === 'critical').length;
    const highRiskCount = (allAnalyses || []).filter(a => a.overall_risk === 'high').length;
    const moderateCount = (allAnalyses || []).filter(a => a.overall_risk === 'moderate').length;

    // 4. Recent patients
    const { data: recentPatients } = await req.supabase
      .from('patients')
      .select('id, full_name, date_of_birth, sex, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false })
      .limit(5);

    return res.json({
      stats: {
        totalPatients: totalPatients || 0,
        totalAnalyses: allAnalyses?.length || 0,
        criticalAlertsCount: criticalCount,
        highRiskAlertsCount: highRiskCount,
        moderateAlertsCount: moderateCount
      },
      recentAnalyses: recentAnalyses || [],
      recentPatients: recentPatients || []
    });
  } catch (err) {
    next(err);
  }
}
