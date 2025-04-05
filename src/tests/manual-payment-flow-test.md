# Manual Test: Payment Flow and Status Update

This document outlines the steps to manually test the payment flow and verify that the payment order status is updated to "completed" when the ThankYouPage receives reference data via URL parameters.

## Prerequisites

1. A local development environment with the application running
2. Mock payment mode enabled in the `.env` file (`VITE_MOCK_PAYMENT=true`)

## Test Steps

### 1. Create a new order

1. Navigate to the package selection page (`/packages`)
2. Select a package
3. Select meals for the package
4. Enter delivery address information
5. Click "Continue to Payment"

### 2. Process payment

1. On the payment page, verify the order summary is correct
2. Click "Process Payment"
3. Since mock payment is enabled, you should be automatically redirected to the Thank You page

### 3. Verify payment status update on Thank You page

1. Check that you've been redirected to a URL like:
   ```
   /thank-you?order=[order-id]&reference=[reference-id]&state=5
   ```

2. Verify the Thank You page shows:
   - "Thank you for your purchase" message
   - "Payment confirmed" message
   - The reference number matching the one in the URL

### 4. Verify database update

1. Open the database and check the `payment_orders` table
2. Find the record corresponding to the order you just created
3. Verify that:
   - `status` is set to "completed"
   - `reference` matches the reference in the URL
   - `completed_at` has a timestamp

## Expected Results

- The payment order status should be updated to "completed" in the database
- The Thank You page should display the payment confirmation message
- The reference number should be displayed on the Thank You page

## Test with URL Parameters Directly

To test just the ThankYouPage component's handling of URL parameters:

1. Create a test order in the database (or use an existing one)
2. Manually navigate to:
   ```
   /thank-you?order=[order-id]&reference=[reference-id]&state=5
   ```
3. Verify the Thank You page displays the payment confirmation message and reference number

## Notes

- The payment status update happens in the `usePayment.ts` hook when the payment is processed
- The ThankYouPage component reads the payment status from the URL parameters (`state=5` indicates success)
- The reference data from the URL is displayed on the Thank You page
