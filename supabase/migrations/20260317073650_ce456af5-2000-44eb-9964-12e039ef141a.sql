
-- Add service_type enum
CREATE TYPE public.service_type AS ENUM ('driving_license', 'outlier_account', 'handshake_ai');

-- Add service_type column to applications
ALTER TABLE public.applications ADD COLUMN service_type public.service_type NOT NULL DEFAULT 'driving_license';

-- Create deliverables table for admin-uploaded files
CREATE TABLE public.deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  doc_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;

-- Clients can view their own deliverables
CREATE POLICY "Users can view own deliverables" ON public.deliverables
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can do everything on deliverables
CREATE POLICY "Admins can manage deliverables" ON public.deliverables
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create deliverables storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('deliverables', 'deliverables', false);

-- Storage policies for deliverables bucket
CREATE POLICY "Admins can upload deliverables" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own deliverables files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deliverables');

CREATE POLICY "Admins can view all deliverables" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deliverables' AND public.has_role(auth.uid(), 'admin'));
