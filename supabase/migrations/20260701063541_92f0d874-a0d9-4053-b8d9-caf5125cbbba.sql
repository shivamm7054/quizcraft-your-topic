
CREATE TABLE public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  questions JSONB NOT NULL,
  time_limit_seconds INTEGER NOT NULL CHECK (time_limit_seconds > 0 AND time_limit_seconds <= 86400),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','ended')),
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX exams_host_idx ON public.exams(host_user_id);
CREATE INDEX exams_code_idx ON public.exams(code);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage own exams" ON public.exams
  FOR ALL TO authenticated
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

CREATE TABLE public.exam_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX exam_submissions_exam_idx ON public.exam_submissions(exam_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_submissions TO authenticated;
GRANT ALL ON public.exam_submissions TO service_role;

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts view submissions for own exams" ON public.exam_submissions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_submissions.exam_id AND e.host_user_id = auth.uid()));

CREATE POLICY "Hosts delete submissions for own exams" ON public.exam_submissions
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exams e WHERE e.id = exam_submissions.exam_id AND e.host_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
