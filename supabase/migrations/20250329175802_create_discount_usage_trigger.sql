-- Function to create discount code usage when payment_order status becomes 'completed'
CREATE OR REPLACE FUNCTION public.create_discount_usage_on_payment_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_log_id uuid;
  v_success boolean := false;
  v_details jsonb;
  v_order_user_id uuid;
  v_order_discount_code_id uuid;
BEGIN
  -- Create initial log entry
  INSERT INTO public.trigger_logs (trigger_name, function_name, record_id, details, success)
  VALUES (TG_NAME, 'create_discount_usage_on_payment_completion', NEW.id, 
          jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'payment_status', NEW.status,
            'order_id', NEW.order_id
          ), 
          false)
  RETURNING id INTO v_log_id;

  -- Log detailed information
  RAISE NOTICE 'Trigger % executing on table % (operation: %) for payment record ID %', 
               TG_NAME, TG_TABLE_NAME, TG_OP, NEW.id;
  RAISE NOTICE 'Payment status: %, order_id: %', NEW.status, NEW.order_id;

  -- Check if the payment_order status is 'completed'
  IF NEW.status = 'completed' THEN
    RAISE NOTICE 'Payment is completed, attempting to create discount code usage for order_id: %', NEW.order_id;
    
    -- Get user_id and discount_code_id from the associated order
    SELECT user_id, discount_code_id 
    INTO v_order_user_id, v_order_discount_code_id
    FROM public.orders 
    WHERE id = NEW.order_id;

    RAISE NOTICE 'Fetched from order %: user_id=%, discount_code_id=%', 
                 NEW.order_id, v_order_user_id, v_order_discount_code_id;

    -- Check if a discount code was actually used for this order
    IF v_order_discount_code_id IS NOT NULL THEN
      RAISE NOTICE 'Discount code found (%), attempting to insert usage record.', v_order_discount_code_id;
      
      -- Insert into discount_code_usages
      BEGIN
        INSERT INTO public.discount_code_usages (code_id, user_id, order_id)
        VALUES (v_order_discount_code_id, v_order_user_id, NEW.order_id)
        ON CONFLICT (user_id, code_id) DO NOTHING; -- Assumes unique_user_code_usage constraint exists
        
        v_success := true;
        RAISE NOTICE 'Successfully inserted discount code usage for order %', NEW.order_id;
      EXCEPTION WHEN OTHERS THEN
        v_details := jsonb_build_object(
          'error', SQLERRM,
          'error_detail', SQLSTATE
        );
        RAISE NOTICE 'Error inserting discount code usage: %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'No discount code associated with order %.', NEW.order_id;
      v_details := jsonb_build_object(
        'reason', 'No discount code associated with the order',
        'order_id', NEW.order_id
      );
      -- We consider this "successful" in terms of trigger execution, even if no usage was inserted
      v_success := true; 
    END IF;
  ELSE
    RAISE NOTICE 'Payment status is not completed: %', NEW.status;
    v_details := jsonb_build_object(
      'reason', 'Payment status not completed',
      'status', NEW.status
    );
  END IF;

  -- Update log entry with results
  UPDATE public.trigger_logs
  SET details = COALESCE(details, '{}'::jsonb) || COALESCE(v_details, '{}'::jsonb),
      success = v_success
  WHERE id = v_log_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Run function with the permissions of the definer (superuser)

-- Drop old function and triggers related to order completion
DROP FUNCTION IF EXISTS public.create_discount_usage_on_order_completion() CASCADE;
DROP FUNCTION IF EXISTS public.update_order_status_on_payment_completion() CASCADE; -- Also drop this as we merge logic

-- Trigger to execute the function after a payment_order is updated
CREATE TRIGGER trigger_create_discount_usage_on_payment_update
  AFTER UPDATE ON public.payment_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'completed') -- Only run when status changes to 'completed'
  EXECUTE FUNCTION public.create_discount_usage_on_payment_completion();

-- Trigger to execute the function after a payment_order is inserted
CREATE TRIGGER trigger_create_discount_usage_on_payment_insert
  AFTER INSERT ON public.payment_orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed') -- Only run when a new payment_order is created with status 'completed'
  EXECUTE FUNCTION public.create_discount_usage_on_payment_completion();

-- Add comments for clarity
COMMENT ON FUNCTION public.create_discount_usage_on_payment_completion() IS 'Trigger function to automatically record discount code usage when a payment_order status becomes completed.';
COMMENT ON TRIGGER trigger_create_discount_usage_on_payment_update ON public.payment_orders IS 'Executes create_discount_usage_on_payment_completion function after a payment_order status is updated to completed.';
COMMENT ON TRIGGER trigger_create_discount_usage_on_payment_insert ON public.payment_orders IS 'Executes create_discount_usage_on_payment_completion function after a new payment_order is created with status completed.';
