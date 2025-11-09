-- Create table for resource feedback
CREATE TABLE public.resource_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL,
  resource_name TEXT NOT NULL,
  feedback_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.resource_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback
CREATE POLICY "Anyone can insert feedback"
ON public.resource_feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to view feedback (for analytics)
CREATE POLICY "Anyone can view feedback"
ON public.resource_feedback
FOR SELECT
TO anon, authenticated
USING (true);