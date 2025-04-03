-- Update function to get users by IDs from auth.users with correct data types
DROP FUNCTION IF EXISTS get_users_by_ids(UUID[]);

CREATE OR REPLACE FUNCTION get_users_by_ids(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.raw_user_meta_data->>'display_name' as display_name
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_by_ids(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_ids(UUID[]) TO service_role;
