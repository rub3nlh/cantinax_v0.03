-- Enable Row Level Security if not already enabled
ALTER TABLE public.delivery_meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (adjust name if necessary)
DROP POLICY IF EXISTS "Allow users to select their own delivery_meals" ON public.delivery_meals;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.delivery_meals; -- Add other potential names if needed

-- New Policy: Allow users to select delivery_meals for their orders OR admins to select all
CREATE POLICY "Allow users own delivery_meals OR admins all"
ON public.delivery_meals
FOR SELECT
USING (
  -- Condition 1: The user owns the associated order
  EXISTS (
    SELECT 1
    FROM public.order_deliveries od
    JOIN public.orders o ON od.order_id = o.id
    WHERE od.id = delivery_id AND o.user_id = auth.uid()
  )
  OR
  -- Condition 2: The user is an admin
  public.is_admin()
);
