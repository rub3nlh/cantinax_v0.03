-- Insert a new single-use discount code
INSERT INTO public.discount_codes (code, description, discount_percentage, type, expires_at, max_uses, is_active)
VALUES (
  'FELIZCUMPLE15',
  '15% de descuento de un solo uso para cualquier usuario (válido por 1 mes)',
  15,
  'single_use',
  now() + interval '1 month',
  1,
  true
);
