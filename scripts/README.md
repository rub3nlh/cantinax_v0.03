# Scripts

This directory contains utility scripts for development and maintenance tasks.

## Payment Webhook Simulation Scripts

These scripts allow you to simulate payment webhook calls to test the payment flow in your local development environment.

### Prerequisites 

- Node.js installed
- The application server running locally at http://localhost:3000
- For shell scripts: curl installed (comes pre-installed on most Unix-like systems)
- Environment variables properly configured:
  ```
  # Frontend Supabase config
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

  # Backend Supabase config (required for webhooks)
  SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_KEY=your_supabase_service_key
  ```
  Note: Make sure both frontend and backend Supabase variables are set in your .env file

### Available Webhook Scripts

#### Node.js Scripts

#### Simulate Successful Payment

```bash
npm run webhook:success
```

This script will:
1. Ask for an order ID (or generate a random one if none is provided)
2. Ask for a payment amount (or use the default of 100€)
3. Send a webhook request to simulate a successful payment (state=5)
4. Update the payment status in the database

#### Simulate Failed Payment

```bash
npm run webhook:fail
```

This script will:
1. Ask for an order ID (or generate a random one if none is provided)
2. Ask for a payment amount (or use the default of 100€)
3. Ask for a failure state:
   - 2 = Payment rejected
   - 3 = Payment link expired
   - 4 = Payment cancelled by user
4. Send a webhook request to simulate a failed payment
5. Update the payment status in the database

#### Shell Scripts

For users who prefer using shell scripts directly, we also provide bash script versions:

#### Simulate Successful Payment

```bash
./scripts/webhook-success.sh
```

This script provides the same functionality as the Node.js version but runs directly in the shell.

#### Simulate Failed Payment

```bash
./scripts/webhook-fail.sh
```

This script provides the same functionality as the Node.js version but runs directly in the shell.

### Usage Example

1. Create an order by going through the payment flow in the application
2. When you reach the payment page, note the order ID (you can find it in the URL or in the browser console)
3. Open a new terminal and run one of the webhook scripts
4. Enter the order ID when prompted
5. The script will simulate a webhook call to update the payment status
6. You can then check the payment status in the application

### Notes

- These scripts are for development and testing purposes only
- In production, the payment gateway (TropiPay) will send real webhook calls
- The signature verification is bypassed in development mode
- The shell scripts use curl to send the webhook requests and will attempt to format the JSON output using jq if available

## Database Migration Scripts

### Apply Migration

```bash
npm run apply-migration
```

This script applies the latest database migration to update the Supabase database schema. It specifically:

1. Checks if the Supabase CLI is installed
2. Verifies that the required environment variables are set
3. Applies the migration using the Supabase CLI
4. Provides alternative instructions if the CLI method fails

### Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Environment variables properly configured:
  ```
  # Supabase credentials
  SUPABASE_URL=your_supabase_url
  SUPABASE_SERVICE_KEY=your_supabase_service_key
  ```

### Usage Example

1. Ensure your `.env` file contains the required Supabase credentials
2. Run the script:
   ```bash
   npm run apply-migration
   ```
3. The script will apply the migration and provide feedback on the process
4. If the CLI method fails, follow the alternative instructions to apply the migration manually through the Supabase dashboard
