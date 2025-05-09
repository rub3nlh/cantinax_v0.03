-- Script para generar 9 códigos de descuento promocionales adicionales
-- Características:
-- - 5%, 10% y 15% de descuento
-- - Válidos solo para primera compra de usuarios
-- - Caducidad de 3 meses desde la creación
-- - Un solo uso por usuario

-- Códigos VACUBA (5%, 10%, 15%)
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'VACUBA5',
  '5% de descuento para tu primera compra (válido por 3 meses)',
  5,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'VACUBA10',
  '10% de descuento para tu primera compra (válido por 3 meses)',
  10,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'VACUBA15',
  '15% de descuento para tu primera compra (válido por 3 meses)',
  15,
  'first_purchase',
  now() + interval '3 months',
  true
);

-- Códigos DIME (5%, 10%, 15%)
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'DIME5',
  '5% de descuento para tu primera compra (válido por 3 meses)',
  5,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'DIME10',
  '10% de descuento para tu primera compra (válido por 3 meses)',
  10,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'DIME15',
  '15% de descuento para tu primera compra (válido por 3 meses)',
  15,
  'first_purchase',
  now() + interval '3 months',
  true
);

-- Códigos TROPI (5%, 10%, 15%)
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'TROPI5',
  '5% de descuento para tu primera compra (válido por 3 meses)',
  5,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'TROPI10',
  '10% de descuento para tu primera compra (válido por 3 meses)',
  10,
  'first_purchase',
  now() + interval '3 months',
  true
);

INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'TROPI15',
  '15% de descuento para tu primera compra (válido por 3 meses)',
  15,
  'first_purchase',
  now() + interval '3 months',
  true
);

-- Log la creación de los códigos para fines de seguimiento
INSERT INTO public.trigger_logs (
  trigger_name,
  function_name,
  record_id,
  details,
  success
) VALUES (
  'migration',
  'insert_new_promotion_codes',
  'system',
  jsonb_build_object(
    'description', 'Added promotional discount codes: VACUBA5, VACUBA10, VACUBA15, DIME5, DIME10, DIME15, TROPI5, TROPI10, TROPI15',
    'discount_percentages', jsonb_build_array(5, 10, 15),
    'expiration', now() + interval '3 months',
    'type', 'first_purchase'
  ),
  true
);
