-- Create table to cache geocoded addresses
CREATE TABLE IF NOT EXISTS public.geocode_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address text NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  display_name text,
  cached_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read from cache (public data)
CREATE POLICY "Anyone can read geocode cache"
ON public.geocode_cache
FOR SELECT
USING (true);

-- Only authenticated users can insert (via edge function with service role)
CREATE POLICY "Service role can insert geocode cache"
ON public.geocode_cache
FOR INSERT
WITH CHECK (true);

-- Create index on address for fast lookups
CREATE INDEX idx_geocode_cache_address ON public.geocode_cache(address);

-- Create index on cached_at for potential cleanup queries
CREATE INDEX idx_geocode_cache_cached_at ON public.geocode_cache(cached_at);