-- Create profiles table for intake form data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  name TEXT NOT NULL,
  age TEXT,
  housing_situation TEXT,
  housing_search_type TEXT,
  immediate_needs TEXT[],
  health_concerns TEXT,
  health_details TEXT,
  education TEXT,
  disabilities TEXT,
  disability_details TEXT,
  additional_info TEXT,
  housing_application_opt_in BOOLEAN,
  sex_offender_registry BOOLEAN,
  where_sleep_frequently TEXT,
  homeless_over_year BOOLEAN,
  household_pregnant BOOLEAN,
  has_children BOOLEAN,
  children_under_five BOOLEAN,
  has_custody BOOLEAN,
  custody_requires_housing BOOLEAN,
  single_parent_household BOOLEAN,
  foster_care_after_16 BOOLEAN,
  household_disability BOOLEAN,
  housing_accommodations TEXT[],
  adults_independent_care BOOLEAN,
  monthly_income TEXT,
  has_housing_voucher BOOLEAN,
  poor_credit_prevented_housing BOOLEAN,
  eviction_past_seven_years BOOLEAN,
  justice_system_prevented_housing BOOLEAN,
  immigration_status_prevented_housing BOOLEAN,
  has_trusted_contacts BOOLEAN,
  physical_health_crisis BOOLEAN,
  mental_health_crisis BOOLEAN,
  violence_trauma BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can manage their own profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();