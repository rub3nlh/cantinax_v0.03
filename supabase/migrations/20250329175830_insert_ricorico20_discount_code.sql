-- Insert a new discount code for first-time purchases
INSERT INTO public.discount_codes (code, description, discount_percentage, type, expires_at, is_active)
VALUES (
  'RICORICO20',
  '20% de descuento para la primera compra de cualquier usuario (válido por 1 mes)',
  20,
  'first_purchase',
  now() + interval '1 month',
  true
);
