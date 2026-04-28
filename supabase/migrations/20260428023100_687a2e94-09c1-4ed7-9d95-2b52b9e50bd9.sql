
-- ENUM types
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.exam_session AS ENUM ('first', 'second');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');
CREATE TYPE public.subject_category AS ENUM ('japanese', 'math', 'science', 'general');

-- profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  passport_number TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  profile_photo_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles (separate table — security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- subjects
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_mn TEXT NOT NULL,
  name_ja TEXT NOT NULL,
  category public.subject_category NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.subjects (code, name_mn, name_ja, category) VALUES
('J1', 'Япон хэл (дээд түвшин)', '日本語(上級)', 'japanese'),
('J2', 'Япон хэл (суурь түвшин)', '日本語(基礎)', 'japanese'),
('K1', 'Математик (байгалийн ухаан)', '数学コース1', 'math'),
('K2', 'Математик (нийгмийн ухаан)', '数学コース2', 'math'),
('PHY', 'Физик', '物理', 'science'),
('CHEM', 'Хими', '化学', 'science'),
('BIO', 'Биологи', '生物', 'science'),
('GEN', 'Ерөнхий хичээл', '総合科目', 'general');

-- exams
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  exam_date DATE NOT NULL,
  location TEXT NOT NULL,
  total_seats INT NOT NULL CHECK (total_seats > 0),
  available_seats INT NOT NULL,
  registration_start DATE NOT NULL,
  registration_end DATE NOT NULL,
  session public.exam_session NOT NULL,
  year INT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE RESTRICT,
  status public.application_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  target_university TEXT,
  phone TEXT,
  address TEXT,
  passport_scan_path TEXT,
  photo_path TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id)
);

-- application_subjects
CREATE TABLE public.application_subjects (
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  PRIMARY KEY (application_id, subject_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER exams_touch BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- application number generator
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  yr INT := EXTRACT(YEAR FROM now());
  cnt INT;
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    SELECT COUNT(*) + 1 INTO cnt FROM public.applications
      WHERE application_number LIKE 'EJU-' || yr || '-%';
    NEW.application_number := 'EJU-' || yr || '-' || LPAD(cnt::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER applications_set_number BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.generate_application_number();

-- available_seats sync on approval
CREATE OR REPLACE FUNCTION public.sync_available_seats()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status <> 'approved' AND NEW.status = 'approved' THEN
    UPDATE public.exams SET available_seats = GREATEST(available_seats - 1, 0)
      WHERE id = NEW.exam_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status <> 'approved' THEN
    UPDATE public.exams SET available_seats = available_seats + 1
      WHERE id = NEW.exam_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER applications_sync_seats AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_available_seats();

-- handle_new_user — auto-create profile + role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, passport_number, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'passport_number', NEW.id::TEXT),
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_subjects ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- subjects: public read, admin write
CREATE POLICY "Anyone reads subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- exams: authenticated read, admin write
CREATE POLICY "Authenticated read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- applications
CREATE POLICY "Users view own applications" ON public.applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all applications" ON public.applications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users create own applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own pending applications" ON public.applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update applications" ON public.applications FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete applications" ON public.applications FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- application_subjects
CREATE POLICY "Users view own app subjects" ON public.application_subjects FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "Admins view all app subjects" ON public.application_subjects FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users manage own app subjects" ON public.application_subjects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.user_id = auth.uid() AND a.status = 'pending'));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('eju-documents', 'eju-documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('eju-photos', 'eju-photos', true);

-- Storage policies: users upload to own folder
CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'eju-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Users read own documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'eju-documents' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Admins read all documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'eju-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone reads photos" ON storage.objects FOR SELECT USING (bucket_id = 'eju-photos');
CREATE POLICY "Users upload own photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'eju-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "Users update own photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'eju-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
