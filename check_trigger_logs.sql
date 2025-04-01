-- Query to check trigger logs
SELECT 
  id,
  trigger_name,
  function_name,
  event_time,
  record_id,
  details,
  success
FROM 
  public.trigger_logs
ORDER BY 
  event_time DESC
LIMIT 20;

-- Query to check if the trigger_logs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'trigger_logs'
) AS trigger_logs_table_exists;

-- Query to check discount code usages
SELECT 
  dcu.id,
  dcu.code_id,
  dc.code,
  dcu.user_id,
  dcu.order_id,
  dcu.used_at
FROM 
  public.discount_code_usages dcu
JOIN 
  public.discount_codes dc ON dcu.code_id = dc.id
ORDER BY 
  dcu.used_at DESC
LIMIT 10;

-- Query to check orders with discount codes
SELECT 
  o.id,
  o.status,
  o.created_at,
  o.discount_code_id,
  dc.code,
  o.user_id
FROM 
  public.orders o
LEFT JOIN 
  public.discount_codes dc ON o.discount_code_id = dc.id
WHERE 
  o.discount_code_id IS NOT NULL
ORDER BY 
  o.created_at DESC
LIMIT 10;

-- Query to check payment orders
SELECT 
  po.id,
  po.order_id,
  po.status,
  po.created_at,
  po.completed_at,
  o.status as order_status,
  o.discount_code_id
FROM 
  public.payment_orders po
JOIN 
  public.orders o ON po.order_id = o.id
ORDER BY 
  po.created_at DESC
LIMIT 10;
