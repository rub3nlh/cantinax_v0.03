-- Helper function to check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Important for RLS checks
SET search_path = public -- Ensure it uses the public schema
AS $$
BEGIN
  -- Check if the currently authenticated user exists in staff_members with the 'admin' role
  RETURN EXISTS (
    SELECT 1
    FROM staff_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users (or specific roles if needed)
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
