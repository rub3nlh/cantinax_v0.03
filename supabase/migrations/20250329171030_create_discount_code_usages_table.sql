-- Create discount_code_usages table
CREATE TABLE public.discount_code_usages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id uuid NOT NULL REFERENCES public.discount_codes(id) ON DELETE RESTRICT, -- Don't delete usage if code is deleted
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Delete usage if user is deleted
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE, -- Delete usage if order is deleted
    used_at timestamptz NOT NULL DEFAULT now(),
    -- Constraint to ensure a user can only use a specific code once
    CONSTRAINT unique_user_code_usage UNIQUE (user_id, code_id)
);

-- Add comments
COMMENT ON TABLE public.discount_code_usages IS 'Tracks the usage of discount codes by users for specific orders.';
COMMENT ON COLUMN public.discount_code_usages.code_id IS 'The discount code that was used.';
COMMENT ON COLUMN public.discount_code_usages.user_id IS 'The user who used the discount code.';
COMMENT ON COLUMN public.discount_code_usages.order_id IS 'The order for which the discount code was applied.';
COMMENT ON CONSTRAINT unique_user_code_usage ON public.discount_code_usages IS 'Ensures each user can use a specific discount code only once.';

-- Add index for faster lookups by user or code
CREATE INDEX idx_discount_code_usages_user_id ON public.discount_code_usages(user_id);
CREATE INDEX idx_discount_code_usages_code_id ON public.discount_code_usages(code_id);

-- Enable Row Level Security
ALTER TABLE public.discount_code_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to read their own usages
CREATE POLICY "Allow users read access to their own usages"
ON public.discount_code_usages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Allow admins to read all usages
CREATE POLICY "Allow admin read access to all usages"
ON public.discount_code_usages
FOR SELECT
USING (public.is_admin()); -- Use the previously created function

-- RLS Policy: !!! IMPORTANT: NO INSERT FOR AUTHENTICATED USERS !!!
-- Insertion MUST happen server-side after successful order/payment validation.
-- This prevents users from marking codes as used without completing an order.
-- Allow admins to insert (e.g., for manual corrections)
CREATE POLICY "Allow admin insert access"
ON public.discount_code_usages
FOR INSERT
WITH CHECK (public.is_admin());

-- RLS Policy: Disallow updates for regular users
-- Allow admins to update (e.g., for corrections)
CREATE POLICY "Allow admin update access"
ON public.discount_code_usages
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- RLS Policy: Disallow deletes for regular users
-- Allow admins to delete (e.g., for corrections)
CREATE POLICY "Allow admin delete access"
ON public.discount_code_usages
FOR DELETE
USING (public.is_admin());
