CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_discount_code_id uuid;
  v_discount_percentage numeric;
  v_discount_type text;
  v_expires_at timestamptz;
  v_max_uses integer;
  v_is_active boolean;
  v_usage_count bigint;
  v_has_previous_orders boolean;
  v_result jsonb;
BEGIN
  -- 1. Find the discount code
  SELECT id, discount_percentage, type, expires_at, max_uses, is_active
  INTO v_discount_code_id, v_discount_percentage, v_discount_type, v_expires_at, v_max_uses, v_is_active
  FROM discount_codes
  WHERE code = p_code;

  -- 2. Check if the code exists
  IF v_discount_code_id IS NULL THEN
    v_result := jsonb_build_object('success', false, 'error', 'Código inválido o no encontrado');
    RETURN v_result;
  END IF;

  -- 3. Check if the code is active
  IF NOT v_is_active THEN
    v_result := jsonb_build_object('success', false, 'error', 'Este código de descuento ya no está activo');
    RETURN v_result;
  END IF;

  -- 4. Check if the code has expired
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    v_result := jsonb_build_object('success', false, 'error', 'Este código de descuento ha expirado');
    RETURN v_result;
  END IF;

  -- 5. Check usage by this specific user
  SELECT count(*) INTO v_usage_count
  FROM discount_code_usages
  WHERE code_id = v_discount_code_id AND user_id = p_user_id;

  IF v_usage_count > 0 THEN
    v_result := jsonb_build_object('success', false, 'error', 'Ya has utilizado este código de descuento');
    RETURN v_result;
  END IF;

  -- 6. Check global max uses (if defined)
  IF v_max_uses IS NOT NULL THEN
    SELECT count(*) INTO v_usage_count
    FROM discount_code_usages
    WHERE code_id = v_discount_code_id;

    IF v_usage_count >= v_max_uses THEN
      v_result := jsonb_build_object('success', false, 'error', 'Este código de descuento ha alcanzado su límite de usos');
      RETURN v_result;
    END IF;
  END IF;

  -- 7. Check 'first_purchase' type
  IF v_discount_type = 'first_purchase' THEN
    SELECT EXISTS (SELECT 1 FROM orders WHERE user_id = p_user_id) INTO v_has_previous_orders;
    IF v_has_previous_orders THEN
      v_result := jsonb_build_object('success', false, 'error', 'Este código solo es válido para tu primera compra');
      RETURN v_result;
    END IF;
  END IF;

  -- 8. Success!
  v_result := jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'id', v_discount_code_id,
      'discount_percentage', v_discount_percentage,
      'type', v_discount_type
    )
  );
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_discount_code(text, uuid) TO authenticated;
