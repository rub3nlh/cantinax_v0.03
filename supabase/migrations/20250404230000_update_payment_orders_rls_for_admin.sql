-- First we need to drop the existing policy
DROP POLICY IF EXISTS "Users can create payment orders" ON public.payment_orders;

-- Then we create a new policy that includes admin access
CREATE POLICY "Users can view and manage their payment orders" 
ON public.payment_orders
USING (
  (EXISTS (
    SELECT 1
    FROM orders
    WHERE ((orders.id = payment_orders.order_id) AND (orders.user_id = auth.uid()))
  ))
  OR
  public.is_admin()
)
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM orders
    WHERE ((orders.id = payment_orders.order_id) AND (orders.user_id = auth.uid()))
  ))
  OR
  public.is_admin()
);