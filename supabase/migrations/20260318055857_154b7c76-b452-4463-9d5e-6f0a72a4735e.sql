
-- Add new service types to enum
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'mercor_ai';
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'full_course';

-- Create service_prices table for admin-configurable pricing
CREATE TABLE public.service_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  icon_name text NOT NULL DEFAULT 'Shield',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read active prices (public landing page)
CREATE POLICY "Anyone can view active prices" ON public.service_prices
  FOR SELECT USING (true);

-- Admins can manage prices
CREATE POLICY "Admins can manage prices" ON public.service_prices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default prices
INSERT INTO public.service_prices (service_key, label, description, price, features, icon_name, display_order) VALUES
  ('driving_license', 'Driving License', 'Get your driving license processed in just 5 business days. Upload your passport photo and we handle the rest.', 150, '["5-day processing", "Full verification", "Digital & physical copy"]', 'Car', 1),
  ('outlier_account', 'Outlier Account', 'Get a verified Outlier platform account set up and ready to use for remote work opportunities.', 160, '["Account setup", "Profile optimization", "Ready to earn"]', 'Briefcase', 2),
  ('handshake_ai', 'Handshake AI Account', 'Get a fully configured Handshake AI account with premium access for career networking.', 220, '["Premium access", "AI-powered matching", "Career tools"]', 'Bot', 3),
  ('mercor_ai', 'Mercor AI Account', 'Get a Mercor AI account set up for freelancing and remote AI work opportunities.', 70, '["Account setup", "AI job matching", "Freelance ready"]', 'Briefcase', 4),
  ('full_course', 'Freelancing AI Course', 'Complete course on how to open and manage freelancing AI accounts successfully.', 50, '["Step-by-step guide", "All platforms covered", "Lifetime access"]', 'BookOpen', 5);

-- Trigger for updated_at
CREATE TRIGGER update_service_prices_updated_at
  BEFORE UPDATE ON public.service_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
