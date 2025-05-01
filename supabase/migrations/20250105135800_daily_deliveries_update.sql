-- Update create_order_deliveries function to use daily deliveries instead of every 2 days
DROP TRIGGER IF EXISTS create_deliveries_on_order ON orders;
DROP FUNCTION IF EXISTS create_order_deliveries();

-- Create enhanced function with daily deliveries
CREATE OR REPLACE FUNCTION create_order_deliveries()
RETURNS TRIGGER AS $$
DECLARE
  total_meals integer := 0;
  remaining_meals integer;
  delivery_date timestamptz;
  delivery_id uuid;
  meal_data jsonb;
  meal_id text;
  meal_count integer;
  meal_index integer := 0;
  meals_array jsonb;
  i integer;
  j integer;
BEGIN
  -- Log the entire meals array for debugging
  meals_array := to_jsonb(NEW.meals);
  
  INSERT INTO trigger_logs (
    trigger_name,
    function_name,
    record_id,
    details,
    success
  ) VALUES (
    'create_deliveries_on_order',
    'create_order_deliveries',
    NEW.id,
    jsonb_build_object('meals_array', meals_array),
    true
  );

  -- First calculate total meals considering counts
  FOR i IN 0..jsonb_array_length(meals_array)-1 LOOP
    meal_data := meals_array->i;
    
    -- Check if meal has count property (new format)
    IF (meal_data->>'count') IS NOT NULL AND (meal_data->>'count')::integer > 0 THEN
      meal_count := (meal_data->>'count')::integer;
      total_meals := total_meals + meal_count;
      
      INSERT INTO trigger_logs (
        trigger_name,
        function_name,
        record_id,
        details,
        success
      ) VALUES (
        'create_deliveries_on_order',
        'create_order_deliveries',
        NEW.id,
        jsonb_build_object(
          'meal_index', i,
          'meal_id', COALESCE(meal_data->'meal'->>'id', meal_data->>'id', 'unknown'),
          'meal_count', meal_count,
          'running_total', total_meals
        ),
        true
      );
    ELSE
      -- Old format or no count specified, assume count of 1
      total_meals := total_meals + 1;
    END IF;
  END LOOP;
  
  -- Validate total meals
  IF total_meals <= 0 THEN
    RAISE EXCEPTION 'Cannot create deliveries for order with no meals';
  END IF;
  
  -- Initialize remaining_meals
  remaining_meals := total_meals;
  
  -- Set initial delivery date (same day as order)
  delivery_date := NEW.created_at;
  
  -- Create deliveries in sequence, processing meals with their counts
  WHILE remaining_meals > 0 LOOP
    -- Create delivery record
    INSERT INTO order_deliveries (
      order_id,
      scheduled_date,
      status,
      meals_count
    ) VALUES (
      NEW.id,
      delivery_date,
      'pending',
      LEAST(2, remaining_meals)
    ) RETURNING id INTO delivery_id;
    
    -- Log the new delivery
    INSERT INTO trigger_logs (
      trigger_name,
      function_name,
      record_id,
      details,
      success
    ) VALUES (
      'create_deliveries_on_order',
      'create_order_deliveries',
      NEW.id,
      jsonb_build_object(
        'delivery_id', delivery_id,
        'meals_to_add', LEAST(2, remaining_meals),
        'remaining_total', remaining_meals
      ),
      true
    );
    
    -- Add up to 2 meals to this delivery, respecting counts
    i := 0;
    j := 0;
    
    -- Keep adding meals until we've added 2 or run out
    WHILE j < LEAST(2, remaining_meals) AND i < jsonb_array_length(meals_array) LOOP
      meal_data := meals_array->i;
      
      -- Determine meal ID and count
      IF jsonb_typeof(meal_data->'meal') = 'object' AND (meal_data->'meal'->>'id') IS NOT NULL THEN
        meal_id := meal_data->'meal'->>'id';
      ELSIF (meal_data->>'id') IS NOT NULL THEN
        meal_id := meal_data->>'id';
      ELSE
        -- Skip invalid meal data
        i := i + 1;
        CONTINUE;
      END IF;
      
      -- Get meal count (default to 1 if not specified)
      meal_count := COALESCE((meal_data->>'count')::integer, 1);
      
      -- If this meal has already been fully processed, skip to next meal
      IF meal_count <= 0 THEN
        i := i + 1;
        CONTINUE;
      END IF;
      
      -- Add this meal to the delivery
      INSERT INTO delivery_meals (
        delivery_id,
        meal_id,
        status
      ) VALUES (
        delivery_id,
        meal_id,
        'pending'
      );
      
      -- Log the meal addition
      INSERT INTO trigger_logs (
        trigger_name,
        function_name,
        record_id,
        details,
        success
      ) VALUES (
        'create_deliveries_on_order',
        'create_order_deliveries',
        NEW.id,
        jsonb_build_object(
          'delivery_id', delivery_id,
          'meal_id', meal_id,
          'meal_index', i,
          'meal_count_before', meal_count,
          'meal_count_after', meal_count - 1
        ),
        true
      );
      
      -- Decrement the meal count in our tracking array
      meal_count := meal_count - 1;
      meals_array := jsonb_set(
        meals_array,
        ARRAY[i::text, 'count'],
        to_jsonb(meal_count)
      );
      
      -- Increment counters
      j := j + 1;
      remaining_meals := remaining_meals - 1;
      
      -- If this meal is now fully processed, move to next meal
      IF meal_count <= 0 THEN
        i := i + 1;
      END IF;
      
      -- If we've added 2 meals or run out of meals, stop
      IF j >= 2 OR remaining_meals <= 0 THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Next delivery in 1 day (changed from 2 days to implement daily deliveries)
    delivery_date := delivery_date + interval '1 day';
  END LOOP;
  
  -- Log successful creation
  INSERT INTO trigger_logs (
    trigger_name,
    function_name,
    record_id,
    details,
    success
  ) VALUES (
    'create_deliveries_on_order',
    'create_order_deliveries',
    NEW.id,
    jsonb_build_object(
      'status', 'completed',
      'total_meals_processed', total_meals
    ),
    true
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO trigger_logs (
    trigger_name,
    function_name,
    record_id,
    details,
    success
  ) VALUES (
    'create_deliveries_on_order',
    'create_order_deliveries',
    COALESCE(NEW.id, 'unknown'),
    jsonb_build_object(
      'error', SQLERRM,
      'context', 'Error creating deliveries'
    ),
    false
  );
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Re-create the trigger
CREATE TRIGGER create_deliveries_on_order
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION create_order_deliveries();

-- Log the migration
INSERT INTO trigger_logs (
  trigger_name,
  function_name,
  record_id,
  details,
  success
) VALUES (
  'migration',
  'daily_deliveries_update',
  'system',
  jsonb_build_object(
    'description', 'Updated create_order_deliveries function to use daily deliveries instead of every 2 days',
    'version', '1.0.0'
  ),
  true
);
