/*
  # Add initial admin user

  1. Changes
    - Add initial admin user with the correct user ID
    - Use the actual user ID from the authenticated user

  2. Security
    - Maintain existing RLS policies
    - No changes to security model
*/

-- First create the user if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'dcfb3883-b154-4f39-8272-b4745014a692') THEN
    INSERT INTO auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      'dcfb3883-b154-4f39-8272-b4745014a692',
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('adminpassword', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert the admin user with the correct user ID
INSERT INTO staff_members (user_id, role)
VALUES ('dcfb3883-b154-4f39-8272-b4745014a692', 'admin')
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_staff_members_user_id ON staff_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);
