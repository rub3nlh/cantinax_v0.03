/*
  # Add manual function to update order status based on deliveries

  1. Changes
    - Add function to manually update order status based on deliveries
    - This function can be called from the client to fix orders that are stuck in pending status
*/

-- Create function to manually update order status based on deliveries
CREATE OR REPLACE FUNCTION public.manual_update_order_status(order_id uuid)
RETURNS boolean AS $$
DECLARE
  delivery_count integer;
  completed_count integer;
  failed_count integer;
  order_record RECORD;
  success boolean := false;
BEGIN
  -- Get counts of deliveries and their statuses
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status IN ('delivered', 'failed')),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO 
    delivery_count,
    completed_count,
    failed_count
  FROM order_deliveries
  WHERE order_id = manual_update_order_status.order_id;

  -- Get current order status
  SELECT status INTO order_record
  FROM orders
  WHERE id = manual_update_order_status.order_id;

  -- Log the current state
  RAISE NOTICE 'Order % has % deliveries, % completed, % failed, current status: %', 
    order_id, delivery_count, completed_count, failed_count, order_record.status;

  -- Update order status based on delivery statuses
  IF delivery_count > 0 AND delivery_count = completed_count THEN
    IF failed_count > 0 THEN
      UPDATE orders SET status = 'cancelled'
      WHERE id = manual_update_order_status.order_id AND status != 'cancelled';
      success := true;
      RAISE NOTICE 'Updated order % status to cancelled', order_id;
    ELSE
      UPDATE orders SET status = 'completed'
      WHERE id = manual_update_order_status.order_id AND status != 'completed';
      success := true;
      RAISE NOTICE 'Updated order % status to completed', order_id;
    END IF;
  ELSIF order_record.status = 'pending' AND EXISTS (
    SELECT 1 FROM order_deliveries 
    WHERE order_id = manual_update_order_status.order_id AND status = 'in_progress'
  ) THEN
    UPDATE orders SET status = 'processing'
    WHERE id = manual_update_order_status.order_id;
    success := true;
    RAISE NOTICE 'Updated order % status to processing', order_id;
  ELSE
    RAISE NOTICE 'No status change needed for order %', order_id;
  END IF;

  RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.manual_update_order_status(uuid) TO authenticated;

-- Log the function creation (commented out due to schema mismatch)
-- INSERT INTO debug_logs (message, operation, path)
-- VALUES (
--   'Created manual_update_order_status function',
--   'CREATE',
--   '/migrations/add_manual_update_order_status_function'
-- );
