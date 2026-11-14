-- Add optional YouTube Media Share link column to donations
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS media_url TEXT;
