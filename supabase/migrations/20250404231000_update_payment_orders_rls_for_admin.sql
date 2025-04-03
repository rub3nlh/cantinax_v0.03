-- First we need to drop the existing policy
DROP POLICY IF EXISTS "Users can create payment orders" ON public.payment_orders;

-- Then we create a new policy that includes admin access
CREATE POLICY "Users can view their payment orders" 
ON public.payment_orders
FOR SELECT
USING (
  (EXISTS (
    SELECT 1
    FROM orders
    WHERE ((orders.id = payment_orders.order_id) AND (orders.user_id = auth.uid()))
  ))
  OR
  public.is_admin()
);

-- Create a separate policy for INSERT operations
CREATE POLICY "Users can create payment orders" 
ON public.payment_orders
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1
    FROM orders
    WHERE ((orders.id = payment_orders.order_id) AND (orders.user_id = auth.uid()))
  ))
  OR
  public.is_admin()
);

-- Create a separate policy for UPDATE operations
CREATE POLICY "Users can update their payment orders" 
ON public.payment_orders
FOR UPDATE
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

-- Create a separate policy for DELETE operations
CREATE POLICY "Users can delete their payment orders" 
ON public.payment_orders
FOR DELETE
USING (
  (EXISTS (
    SELECT 1
    FROM orders
    WHERE ((orders.id = payment_orders.order_id) AND (orders.user_id = auth.uid()))
  ))
  OR
  public.is_admin()
);
