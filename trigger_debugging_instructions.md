# Trigger Debugging Instructions

We've added detailed logging to the database triggers to help diagnose why discount code usages are not being recorded correctly. This document explains how to use these logs to identify the issue.

## What We've Added

1. A new `trigger_logs` table that records detailed information about trigger executions (in migration file `20250401110000_create_trigger_logs_table.sql`)
2. Enhanced logging in the trigger functions using `RAISE NOTICE` statements (in migration file `20250329175802_create_discount_usage_trigger.sql`)
3. Exception handling to capture errors during trigger execution
4. SQL queries to inspect the logs and related data (in `check_trigger_logs.sql`)

## How to Test and Debug

1. Process a payment with a discount code applied
2. Run the SQL queries in `check_trigger_logs.sql` to examine what happened
3. Look for any error messages or unexpected behavior in the logs

## Understanding the Logs

The `trigger_logs` table contains the following information:

- `id`: Unique identifier for the log entry
- `trigger_name`: Name of the trigger that fired
- `function_name`: Name of the function that was executed
- `event_time`: When the trigger fired
- `record_id`: ID of the record that triggered the function
- `details`: JSON object with detailed information about the trigger execution
- `success`: Boolean indicating whether the trigger function completed successfully

## Common Issues to Look For

1. **Trigger not firing**: No log entries for a particular trigger
2. **Condition not met**: Log entries show the trigger fired but conditions weren't met
3. **Error during execution**: Log entries show an error occurred
4. **Missing data**: Required data (like discount_code_id) is missing

## Trigger Flow

The expected flow is:

1. When a payment is completed, the `payment_orders` table is updated with status='completed' (or inserted with this status).
2. This triggers `create_discount_usage_on_payment_completion()`.
3. This function checks if the associated order in the `orders` table has a `discount_code_id`.
4. If a `discount_code_id` exists, the function inserts a record into the `discount_code_usages` table.

If the trigger doesn't fire or if there's an error during the insertion into `discount_code_usages`, the usage won't be recorded.

## How to Run the Queries

You can run the queries in the Supabase dashboard:

1. Go to https://supabase.com/dashboard/project/spauqltlvfrjmfrghpgk/sql
2. Copy and paste the queries from `check_trigger_logs.sql`
3. Run each query to see the results

Alternatively, you can use the Supabase CLI:

```bash
supabase db execute -f check_trigger_logs.sql
