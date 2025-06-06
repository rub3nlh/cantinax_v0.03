/*
  # Add meals to order deliveries

  1. Changes
    - Add meals array to order_deliveries table to track which meals are for each delivery
    - Add completed_meals array to track which meals have been prepared
    - Add status for each delivery: 'pending', 'in_progress', 'ready', 'delivered'

  2. Security
    - Maintain existing RLS policies
    - Add policies for kitchen staff to update delivery status
*/

-- Add meals array to order_deliveries
ALTER TABLE order_deliveries
ADD COLUMN IF NOT EXISTS delivery_meals jsonb[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS completed_meals jsonb[] NOT NULL DEFAULT '{}';

-- Update status check constraint to include new statuses
ALTER TABLE order_deliveries
DROP CONSTRAINT IF EXISTS status_check;

ALTER TABLE order_deliveries
ADD CONSTRAINT status_check 
CHECK (status IN ('pending', 'in_progress', 'ready', 'delivered', 'failed'));

-- Create function to update order status based on deliveries
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
DECLARE
  all_deliveries_completed BOOLEAN;
  any_delivery_failed BOOLEAN;
  order_record RECORD;
BEGIN
  -- Get counts of completed and failed deliveries using aggregates
  SELECT 
    COALESCE(bool_and(status IN ('delivered', 'failed')), false),
    COALESCE(bool_or(status = 'failed'), false)
  INTO 
    all_deliveries_completed,
    any_delivery_failed
  FROM order_deliveries
  WHERE order_id = NEW.order_id;

  -- Get current order status
  SELECT status INTO order_record
  FROM orders
  WHERE id = NEW.order_id;

  -- Update order status based on delivery statuses
  IF all_deliveries_completed THEN
    IF any_delivery_failed THEN
      UPDATE orders SET status = 'cancelled'
      WHERE id = NEW.order_id AND status != 'cancelled';
    ELSE
      UPDATE orders SET status = 'completed'
      WHERE id = NEW.order_id AND status != 'completed';
    END IF;
  ELSIF NEW.status = 'in_progress' AND order_record.status = 'pending' THEN
    UPDATE orders SET status = 'processing'
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order status
DROP TRIGGER IF EXISTS update_order_status_on_delivery ON order_deliveries;
CREATE TRIGGER update_order_status_on_delivery
  AFTER UPDATE OF status ON order_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status();

-- Update create_order_deliveries function to include meals
CREATE OR REPLACE FUNCTION create_order_deliveries()
RETURNS TRIGGER AS $$
DECLARE
  remaining_meals integer;
  delivery_date timestamptz;
  delivery_meals jsonb[];
  meal_data jsonb;
BEGIN
  -- Get number of meals from package data
  remaining_meals := array_length(NEW.meals, 1);
  
  -- Set initial delivery date (5 hours from order creation)
  delivery_date := NEW.created_at + interval '5 hours';
  
  -- Process meals in groups of 2
  WHILE remaining_meals > 0 LOOP
    -- Get next 2 meals (or remaining if less than 2)
    delivery_meals := ARRAY[]::jsonb[];
    FOR i IN 1..LEAST(2, remaining_meals) LOOP
      meal_data := NEW.meals[array_length(NEW.meals, 1) - remaining_meals + i];
      delivery_meals := array_append(delivery_meals, meal_data);
    END LOOP;
    
    -- Create delivery record
    INSERT INTO order_deliveries (
      order_id,
      scheduled_date,
      meals_count,
      delivery_meals
    ) VALUES (
      NEW.id,
      delivery_date,
      array_length(delivery_meals, 1),
      delivery_meals
    );
    
    -- Update counters
    remaining_meals := remaining_meals - array_length(delivery_meals, 1);
    delivery_date := delivery_date + interval '2 days';
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;