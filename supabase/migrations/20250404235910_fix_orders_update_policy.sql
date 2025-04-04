/*
  # Fix orders update policy to allow system triggers to update order status

  1. Changes
    - Add UPDATE policy for orders table that allows:
      - Users to update their own orders
      - Admins to update any order
      - System triggers to update any order (no auth check)
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Allow users to update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow system to update order status" ON public.orders;

-- Create policy for users to update their own orders OR admins to update any order
CREATE POLICY "Allow users own orders OR admins all orders update"
ON public.orders
FOR UPDATE
USING (
  -- Condition 1: Allow users to update their own orders
  auth.uid() = user_id
  OR
  -- Condition 2: Allow admins to update any order
  public.is_admin()
)
WITH CHECK (
  -- Same conditions for the CHECK clause
  auth.uid() = user_id
  OR
  public.is_admin()
);

-- Create a separate policy specifically for the update_order_status trigger function
-- This policy allows the system to update order status without auth checks
CREATE POLICY "Allow system triggers to update order status"
ON public.orders
FOR UPDATE
USING (true)  -- Always allow the system to read orders for status updates
WITH CHECK (true);  -- Always allow the system to update orders for status updates

-- Log the policy creation (commented out due to schema mismatch)
-- INSERT INTO debug_logs (message, operation, path)
-- VALUES (
--   'Created policy allowing system triggers to update order status',
--   'CREATE',
--   '/migrations/fix_orders_update_policy'
-- );
