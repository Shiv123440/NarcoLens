CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'officer');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  officer_id text NOT NULL DEFAULT '',
  station text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.can_access_evidence(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('officer','supervisor','admin'))
$$;

CREATE POLICY "Own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.can_access_evidence(auth.uid()) OR id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.evidence_records (
  id text PRIMARY KEY,
  case_number text NOT NULL,
  substance text NOT NULL,
  summary text NOT NULL DEFAULT '',
  verdict text NOT NULL CHECK (verdict IN ('NEGATIVE','POSITIVE','INCONCLUSIVE')),
  tested_at timestamptz NOT NULL DEFAULT now(),
  location text NOT NULL DEFAULT '',
  officer_name text NOT NULL DEFAULT '',
  created_by uuid NOT NULL DEFAULT auth.uid(),
  sha256 text NOT NULL,
  sealed boolean NOT NULL DEFAULT true,
  reagent text NOT NULL DEFAULT '',
  reagents text[] NOT NULL DEFAULT '{}',
  confidence integer NOT NULL DEFAULT 0,
  image_width integer,
  image_height integer,
  gps text,
  fir_number text,
  kit_batch text,
  notes text,
  custody jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evidence_records TO authenticated;
GRANT ALL ON public.evidence_records TO service_role;
ALTER TABLE public.evidence_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX evidence_records_tested_at_idx ON public.evidence_records (tested_at DESC);

CREATE POLICY "Officers read shared evidence" ON public.evidence_records FOR SELECT TO authenticated USING (public.can_access_evidence(auth.uid()));
CREATE POLICY "Officers create own evidence" ON public.evidence_records FOR INSERT TO authenticated WITH CHECK (public.can_access_evidence(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Officers append custody" ON public.evidence_records FOR UPDATE TO authenticated USING (public.can_access_evidence(auth.uid())) WITH CHECK (public.can_access_evidence(auth.uid()));
CREATE POLICY "Admins delete evidence" ON public.evidence_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Sealed evidence is immutable: only the custody log may change on update.
CREATE OR REPLACE FUNCTION public.protect_sealed_evidence()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (to_jsonb(NEW) - 'custody') IS DISTINCT FROM (to_jsonb(OLD) - 'custody') THEN
    RAISE EXCEPTION 'Sealed evidence fields cannot be modified';
  END IF;
  IF jsonb_array_length(NEW.custody) < jsonb_array_length(OLD.custody)
     OR NEW.custody -> 0 IS DISTINCT FROM OLD.custody -> 0 AND jsonb_array_length(OLD.custody) > 0 THEN
    RAISE EXCEPTION 'Custody log is append-only';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER evidence_records_protect BEFORE UPDATE ON public.evidence_records
FOR EACH ROW EXECUTE FUNCTION public.protect_sealed_evidence();

CREATE OR REPLACE FUNCTION public.handle_new_officer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, officer_id, station)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'officer_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'station', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'officer');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_officer();