-- Create discount_codes table
CREATE TABLE public.discount_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL CHECK (char_length(code) > 0), -- Ensure code is not empty
    description text,
    discount_percentage numeric NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    type text NOT NULL CHECK (type IN ('first_purchase', 'single_use')),
    expires_at timestamptz,
    max_uses integer CHECK (max_uses IS NULL OR max_uses > 0),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Add comments for clarity
COMMENT ON TABLE public.discount_codes IS 'Stores available discount codes and their properties.';
COMMENT ON COLUMN public.discount_codes.code IS 'The unique code string users enter.';
COMMENT ON COLUMN public.discount_codes.discount_percentage IS 'Percentage discount (e.g., 20 for 20%).';
COMMENT ON COLUMN public.discount_codes.type IS 'Type of discount: ''first_purchase'' or ''single_use''.';
COMMENT ON COLUMN public.discount_codes.expires_at IS 'Optional expiration date for the code.';
COMMENT ON COLUMN public.discount_codes.max_uses IS 'Optional global limit on the number of times the code can be used.';
COMMENT ON COLUMN public.discount_codes.is_active IS 'Whether the code can currently be used.';

-- Enable Row Level Security
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read active codes
-- Note: For better security, validation should ideally happen in an Edge Function,
-- but this allows the client to potentially check basic validity if needed.
-- Consider making this admin-only read if codes should be secret.
CREATE POLICY "Allow authenticated users read access to active codes"
ON public.discount_codes
FOR SELECT
TO authenticated -- Or specify roles like 'service_role' if only backend reads
USING (is_active = true);

-- RLS Policy: Allow admins (or specific roles) full control
-- Replace 'admin' with your actual admin role identifier if different,
-- potentially using the is_admin() function if applicable and desired.
-- This assumes direct management via Supabase dashboard or specific admin tools.
CREATE POLICY "Allow admin full access"
ON public.discount_codes
FOR ALL
USING (public.is_admin()) -- Use the previously created function
WITH CHECK (public.is_admin());
