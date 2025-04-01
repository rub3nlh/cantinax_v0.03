-- Insert a new birthday discount code with 25% discount
-- This code can only be used once total (not once per user)
-- It expires in one month, and once used, no other client can use it
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  max_uses,
  is_active
)
VALUES (
  'FELIZDIA25',
  'Código especial de cumpleaños con 25% de descuento. Uso único.',
  25,
  'single_use',
  now() + interval '1 month',
  1, -- Can only be used once total
  true
);
