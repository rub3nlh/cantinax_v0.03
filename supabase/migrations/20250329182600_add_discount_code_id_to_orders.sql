-- Add discount_code_id column to the orders table
ALTER TABLE public.orders
ADD COLUMN discount_code_id uuid REFERENCES public.discount_codes(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.discount_code_id IS 'The discount code used for this order (if any).';
