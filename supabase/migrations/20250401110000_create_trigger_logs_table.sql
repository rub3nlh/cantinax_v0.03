-- Create a table to store trigger execution logs
CREATE TABLE IF NOT EXISTS public.trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_name text NOT NULL,
  function_name text NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  record_id text,
  details jsonb,
  success boolean
);

-- Add comments for clarity
COMMENT ON TABLE public.trigger_logs IS 'Stores logs of trigger executions for debugging purposes';
COMMENT ON COLUMN public.trigger_logs.trigger_name IS 'Name of the trigger that fired';
COMMENT ON COLUMN public.trigger_logs.function_name IS 'Name of the function that was executed';
COMMENT ON COLUMN public.trigger_logs.event_time IS 'When the trigger fired';
COMMENT ON COLUMN public.trigger_logs.record_id IS 'ID of the record that triggered the function';
COMMENT ON COLUMN public.trigger_logs.details IS 'JSON object with detailed information about the trigger execution';
COMMENT ON COLUMN public.trigger_logs.success IS 'Boolean indicating whether the trigger function completed successfully';

-- Grant access to authenticated users
ALTER TABLE public.trigger_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow admins to read all logs
CREATE POLICY "Allow admin read access to all logs"
ON public.trigger_logs
FOR SELECT
USING (public.is_admin());

-- RLS Policy: Allow trigger functions to insert logs
CREATE POLICY "Allow trigger functions to insert logs"
ON public.trigger_logs
FOR INSERT
WITH CHECK (true);
