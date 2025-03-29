-- Enable Row Level Security if not already enabled
ALTER TABLE public.order_deliveries ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (adjust name if necessary)
DROP POLICY IF EXISTS "Allow users to select their own order_deliveries" ON public.order_deliveries;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_deliveries; -- Add other potential names if needed

-- New Policy: Allow users to select order_deliveries for their orders OR admins to select all
CREATE POLICY "Allow users own order_deliveries OR admins all"
ON public.order_deliveries
FOR SELECT
USING (
  -- Condition 1: The user owns the associated order
  EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = order_id AND user_id = auth.uid()
  )
  OR
  -- Condition 2: The user is an admin
  public.is_admin()
);
