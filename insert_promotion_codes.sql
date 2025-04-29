-- Script para generar 3 códigos de descuento promocionales
-- Características:
-- - 20% de descuento
-- - Válidos solo para primera compra de usuarios
-- - Caducidad de 3 meses desde la creación
-- - Un solo uso por usuario

-- Código 1: VACUBA20
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'VACUBA20',
  '20% de descuento para tu primera compra (válido por 3 meses)',
  20,
  'first_purchase',
  now() + interval '3 months',
  true
);

-- Código 2: TROPY20
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'TROPY20',
  '20% de descuento para tu primera compra (válido por 3 meses)',
  20,
  'first_purchase',
  now() + interval '3 months',
  true
);

-- Código 3: DIME20
INSERT INTO public.discount_codes (
  code, 
  description, 
  discount_percentage, 
  type, 
  expires_at, 
  is_active
)
VALUES (
  'DIME20',
  '20% de descuento para tu primera compra (válido por 3 meses)',
  20,
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
  'manual_script',
  'insert_promotion_codes',
  'system',
  jsonb_build_object(
    'description', 'Added promotional discount codes: VACUBA20, TROPY20, DIME20',
    'discount_percentage', 20,
    'expiration', now() + interval '3 months',
    'type', 'first_purchase'
  ),
  true
);

-- Para insertar este script como una migración de Supabase, puedes usar:
-- 1. Crear un nuevo archivo en /supabase/migrations/[timestamp]_insert_promotion_codes.sql
-- 2. Copiar y pegar este contenido en el archivo
-- 3. Ejecutar la migración con 'supabase db push'