-- ==============================================================================
-- SECTION A: CLEAN SUPABASE POSTGRESQL SCHEMA FOR NOWSHERA DIGITAL ATS
-- Project: Job Recruitment / Applicant Tracking System
-- Company: Nowshera Digital
-- Safe for direct execution on an empty Supabase project (DDL & Security ONLY)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  phone TEXT,
  current_cv_path TEXT,
  current_cv_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('Full-time', 'Part-time', 'Internship')),
  description TEXT NOT NULL,
  requirements TEXT[] NOT NULL DEFAULT '{}',
  last_date DATE NOT NULL,
  openings INTEGER NOT NULL CHECK (openings > 0),
  filled_openings INTEGER NOT NULL DEFAULT 0 CHECK (filled_openings >= 0 AND filled_openings <= openings),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. JOB RECRUITERS ASSIGNMENT TABLE
CREATE TABLE IF NOT EXISTS public.job_recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, recruiter_id)
);

-- Backward compatibility view for recruiter_assignments
CREATE OR REPLACE VIEW public.recruiter_assignments AS
  SELECT id, job_id, recruiter_id, assigned_at FROM public.job_recruiters;

-- 5. CVS TABLE (Private file reference)
CREATE TABLE IF NOT EXISTS public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 2097152), -- Max 2 MB
  mime_type TEXT NOT NULL DEFAULT 'application/pdf' CHECK (mime_type = 'application/pdf'),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE RESTRICT,
  candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  cv_file_path TEXT NOT NULL,
  cv_file_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint: Only ONE active application per candidate per job
-- (Withdrawn does not block candidate from reapplying; new application creates a fresh record)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_app_per_job
  ON public.applications (job_id, candidate_id)
  WHERE status NOT IN ('withdrawn');

-- Helpful lookup indexes
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);

-- 7. APPLICATION STAGE HISTORY TABLE (Audit Trail)
CREATE TABLE IF NOT EXISTS public.application_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  old_stage TEXT NOT NULL CHECK (old_stage IN ('applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  new_stage TEXT NOT NULL CHECK (new_stage IN ('applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stage_hist_app_id ON public.application_stage_history (application_id);

-- 8. RECRUITER PRIVATE EVALUATION NOTES
CREATE TABLE IF NOT EXISTS public.recruiter_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_notes_app_id ON public.recruiter_notes (application_id);

-- 9. INTERVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.profiles(id),
  scheduled_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location_or_link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_interview_duration CHECK (end_time = scheduled_time + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_interviews_recruiter_schedule
  ON public.interviews (recruiter_id, scheduled_time, end_time);
CREATE INDEX IF NOT EXISTS idx_interviews_app_id ON public.interviews (application_id);

-- 10. AI CV SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL UNIQUE REFERENCES public.applications(id) ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cvs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  short_profile JSONB DEFAULT '[]'::jsonb,
  requirements_found JSONB DEFAULT '[]'::jsonb,
  requirements_not_found JSONB DEFAULT '[]'::jsonb,
  interview_questions JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. EMAIL EVENTS LOG TABLE (n8n Webhook Integration)
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('application_received', 'interview_invitation', 'hired', 'rejected', 'recruiter_setup')),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'dispatched_to_n8n', 'simulated')),
  idempotency_key TEXT NOT NULL UNIQUE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_idempotency ON public.email_events (idempotency_key);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & HELPER FUNCTIONS
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Helper: Get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: Check if caller is recruiter assigned to the job
CREATE OR REPLACE FUNCTION public.is_recruiter_for_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_recruiters
    WHERE job_id = job_id_param AND recruiter_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Profiles RLS
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'recruiter' AND role = 'candidate')
  );

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.current_user_role() = 'admin'
  );

-- 2. Jobs RLS
DROP POLICY IF EXISTS "Jobs select policy" ON public.jobs;
CREATE POLICY "Jobs select policy" ON public.jobs
  FOR SELECT USING (
    status = 'open'
    OR public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'recruiter' AND public.is_recruiter_for_job(id))
  );

DROP POLICY IF EXISTS "Jobs admin write policy" ON public.jobs;
CREATE POLICY "Jobs admin write policy" ON public.jobs
  FOR ALL USING (public.current_user_role() = 'admin');

-- 3. Job Recruiters RLS
DROP POLICY IF EXISTS "Job recruiters select policy" ON public.job_recruiters;
CREATE POLICY "Job recruiters select policy" ON public.job_recruiters
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR recruiter_id = auth.uid()
  );

DROP POLICY IF EXISTS "Job recruiters admin write policy" ON public.job_recruiters;
CREATE POLICY "Job recruiters admin write policy" ON public.job_recruiters
  FOR ALL USING (public.current_user_role() = 'admin');

-- 4. CVs RLS
DROP POLICY IF EXISTS "CVs select policy" ON public.cvs;
CREATE POLICY "CVs select policy" ON public.cvs
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.candidate_id = cvs.candidate_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

DROP POLICY IF EXISTS "CVs insert policy" ON public.cvs;
CREATE POLICY "CVs insert policy" ON public.cvs
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid() OR public.current_user_role() = 'admin'
  );

-- 5. Applications RLS
DROP POLICY IF EXISTS "Applications select policy" ON public.applications;
CREATE POLICY "Applications select policy" ON public.applications
  FOR SELECT USING (
    candidate_id = auth.uid()
    OR public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'recruiter' AND public.is_recruiter_for_job(job_id))
  );

DROP POLICY IF EXISTS "Candidate apply policy" ON public.applications;
CREATE POLICY "Candidate apply policy" ON public.applications
  FOR INSERT WITH CHECK (
    candidate_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.status = 'open' AND j.last_date >= CURRENT_DATE
    )
  );

DROP POLICY IF EXISTS "Candidate withdraw policy" ON public.applications;
CREATE POLICY "Candidate withdraw policy" ON public.applications
  FOR UPDATE USING (
    candidate_id = auth.uid() AND status NOT IN ('hired', 'rejected', 'withdrawn')
  );

DROP POLICY IF EXISTS "Recruiter / Admin application update policy" ON public.applications;
CREATE POLICY "Recruiter / Admin application update policy" ON public.applications
  FOR UPDATE USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'recruiter' AND public.is_recruiter_for_job(job_id))
  );

-- 6. Application Stage History RLS
DROP POLICY IF EXISTS "Stage history select policy" ON public.application_stage_history;
CREATE POLICY "Stage history select policy" ON public.application_stage_history
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND (
        a.candidate_id = auth.uid()
        OR (public.current_user_role() = 'recruiter' AND public.is_recruiter_for_job(a.job_id))
      )
    )
  );

DROP POLICY IF EXISTS "Stage history insert policy" ON public.application_stage_history;
CREATE POLICY "Stage history insert policy" ON public.application_stage_history
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
    OR (
      public.current_user_role() = 'candidate'
      AND changed_by = auth.uid()
      AND new_stage = 'withdrawn'
    )
  );

-- 7. Recruiter Notes RLS (CANDIDATES STRICTLY FORBIDDEN)
DROP POLICY IF EXISTS "Recruiter notes select policy" ON public.recruiter_notes;
CREATE POLICY "Recruiter notes select policy" ON public.recruiter_notes
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

DROP POLICY IF EXISTS "Recruiter notes insert policy" ON public.recruiter_notes;
CREATE POLICY "Recruiter notes insert policy" ON public.recruiter_notes
  FOR INSERT WITH CHECK (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND recruiter_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

-- 8. Interviews RLS
DROP POLICY IF EXISTS "Interviews select policy" ON public.interviews;
CREATE POLICY "Interviews select policy" ON public.interviews
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR recruiter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND a.candidate_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
    )
  );

DROP POLICY IF EXISTS "Interviews write policy" ON public.interviews;
CREATE POLICY "Interviews write policy" ON public.interviews
  FOR ALL USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

-- 9. AI Summaries RLS (CANDIDATES STRICTLY FORBIDDEN)
DROP POLICY IF EXISTS "AI Summaries select policy" ON public.ai_summaries;
CREATE POLICY "AI Summaries select policy" ON public.ai_summaries
  FOR SELECT USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

DROP POLICY IF EXISTS "AI Summaries write policy" ON public.ai_summaries;
CREATE POLICY "AI Summaries write policy" ON public.ai_summaries
  FOR ALL USING (
    public.current_user_role() = 'admin'
    OR (
      public.current_user_role() = 'recruiter'
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.id = application_id AND public.is_recruiter_for_job(a.job_id)
      )
    )
  );

-- 10. Email Events RLS (Admin and service role only)
DROP POLICY IF EXISTS "Email events admin policy" ON public.email_events;
CREATE POLICY "Email events admin policy" ON public.email_events
  FOR ALL USING (public.current_user_role() = 'admin');

-- ==============================================================================
-- AUTH TRIGGER: Securely sync auth.users with public.profiles
-- Prevents privilege escalation during public signups.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'candidate';
BEGIN
  -- Security enforcement:
  -- 1. If role is explicitly set via secure raw_app_meta_data (service role / admin dashboard)
  IF NEW.raw_app_meta_data ? 'role' AND (NEW.raw_app_meta_data->>'role') IN ('candidate', 'recruiter', 'admin') THEN
    v_role := NEW.raw_app_meta_data->>'role';
  -- 2. Domain & administrative email role assignment for designated testing/corporate accounts
  ELSIF LOWER(NEW.email) = 'admin@nowsheradigital.com' THEN
    v_role := 'admin';
  ELSIF LOWER(NEW.email) LIKE '%.recruiter@nowsheradigital.com' THEN
    v_role := 'recruiter';
  ELSE
    -- Untrusted raw_user_meta_data cannot escalate role; defaults safely to candidate
    v_role := 'candidate';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, phone, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    NEW.raw_user_meta_data->>'phone',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- STORAGE CONFIGURATION (Private cv-files bucket & Storage RLS)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cv-files', 'cv-files', false, 2097152, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['application/pdf'];

-- Storage RLS on storage.objects
DROP POLICY IF EXISTS "Private CV Access Policy" ON storage.objects;
CREATE POLICY "Private CV Access Policy" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'cv-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.current_user_role() = 'admin'
      OR public.current_user_role() = 'recruiter'
    )
  );

DROP POLICY IF EXISTS "Private CV Upload Policy" ON storage.objects;
CREATE POLICY "Private CV Upload Policy" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'cv-files'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.current_user_role() = 'admin'
    )
  );
