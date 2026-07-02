
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant_principal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'learning_specialist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'leading_teacher';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ot';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'slp';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'physio';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'aha';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'psychologist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'behaviour_specialist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'nurse';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'wellbeing_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'attendance_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'it_admin';

DO $$ BEGIN
  CREATE TYPE public.role_group AS ENUM ('teacher','leadership','allied_health','wellbeing','it');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
