-- Update create_order_deliveries function to handle custom packages with proper meal distribution
DROP TRIGGER IF EXISTS create_deliveries_on_order ON orders;
DROP FUNCTION IF EXISTS create_order_deliveries();

-- Create enhanced function with custom package handling
CREATE OR REPLACE FUNCTION create_order_deliveries()
RETURNS TRIGGER AS $$
DECLARE
  total_meals integer := 0;
  total_days integer := 1; -- Default to 1 day if not specified
  meals_per_day integer := 1;
  extra_meals integer := 0;
  remaining_meals integer;
  delivery_date timestamptz;
  delivery_id uuid;
  meal_data jsonb;
  meal_id text;
  meal_count integer;
  meal_index integer := 0;
  meals_array jsonb;
  is_custom_package boolean := false;
  package_description text;
  i integer;
  j integer;
  current_day integer := 0;
  meals_for_current_day integer;
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
  
  -- Check if this is a custom package by looking at package_id or description
  is_custom_package := NEW.package_id = 'custom';
  
  -- If it's a custom package, try to extract days from the description
  IF is_custom_package THEN
    package_description := NEW.package_data->>'description';
    
    -- Try to extract days from description format like "X comidas en Y días"
    IF package_description ~ 'comidas en \d+ días' THEN
      total_days := (regexp_matches(package_description, 'en (\d+) días', 'i'))[1]::integer;
    END IF;
    
    -- Log the custom package details
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
        'is_custom_package', is_custom_package,
        'package_description', package_description,
        'total_days', total_days,
        'total_meals', total_meals
      ),
      true
    );
    
    -- Calculate meals per day and extra meals
    meals_per_day := total_meals / total_days;
    extra_meals := total_meals % total_days;
    
    -- Log the meal distribution calculation
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
        'meals_per_day', meals_per_day,
        'extra_meals', extra_meals
      ),
      true
    );
  END IF;
  
  -- Initialize remaining_meals
  remaining_meals := total_meals;
  
  -- Set initial delivery date (same day as order)
  delivery_date := NEW.created_at;
  
  -- Create deliveries in sequence, processing meals with their counts
  WHILE remaining_meals > 0 LOOP
    -- For custom packages, calculate how many meals to include in this delivery
    IF is_custom_package THEN
      current_day := current_day + 1;
      
      -- Calculate meals for this day (base meals per day + 1 extra if needed)
      meals_for_current_day := meals_per_day;
      IF extra_meals > 0 THEN
        meals_for_current_day := meals_for_current_day + 1;
        extra_meals := extra_meals - 1;
      END IF;
      
      -- Ensure we don't exceed remaining meals
      meals_for_current_day := LEAST(meals_for_current_day, remaining_meals);
    ELSE
      -- For standard packages, use 1 meal per delivery (daily deliveries)
      meals_for_current_day := 1;
    END IF;
    
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
      meals_for_current_day
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
        'delivery_date', delivery_date,
        'meals_to_add', meals_for_current_day,
        'remaining_total', remaining_meals,
        'is_custom_package', is_custom_package,
        'current_day', current_day
      ),
      true
    );
    
    -- Add meals to this delivery, respecting counts
    i := 0;
    j := 0;
    
    -- Keep adding meals until we've added the required number or run out
    WHILE j < meals_for_current_day AND i < jsonb_array_length(meals_array) LOOP
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
      
      -- If we've added all meals for this day or run out of meals, stop
      IF j >= meals_for_current_day OR remaining_meals <= 0 THEN
        EXIT;
      END IF;
    END LOOP;
    
    -- Next delivery in 1 day
    delivery_date := delivery_date + interval '1 day';
    
    -- If we've created all the deliveries for a custom package, exit the loop
    IF is_custom_package AND current_day >= total_days THEN
      EXIT;
    END IF;
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
      'total_meals_processed', total_meals,
      'total_days', total_days,
      'is_custom_package', is_custom_package
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
  'custom_package_daily_deliveries',
  'system',
  jsonb_build_object(
    'description', 'Updated create_order_deliveries function to handle custom packages with proper meal distribution',
    'version', '1.0.0'
  ),
  true
);
