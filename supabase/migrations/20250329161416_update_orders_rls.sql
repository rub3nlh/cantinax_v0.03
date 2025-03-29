-- Enable Row Level Security if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (adjust name if necessary)
-- Common names might be "Enable read access for authenticated users" or similar
DROP POLICY IF EXISTS "Allow users to select their own orders" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders; -- Add other potential names if needed

-- New Policy: Allow users to select their own orders OR admins to select all orders
CREATE POLICY "Allow users own orders OR admins all orders"
ON public.orders
FOR SELECT -- Apply this policy to SELECT operations
USING (
  -- Condition 1: Allow users to see their own orders
  auth.uid() = user_id
  OR
  -- Condition 2: Allow users identified as admin by the helper function to see all orders
  public.is_admin() -- Use the function created in the previous migration
);

-- Note: You might need separate policies for INSERT, UPDATE, DELETE
-- This migration only addresses SELECT access for admins.
