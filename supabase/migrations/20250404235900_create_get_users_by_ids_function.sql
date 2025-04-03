-- Function to get users by IDs from auth.users
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
