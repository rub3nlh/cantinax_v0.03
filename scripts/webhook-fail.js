import axios from 'axios';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import readline from 'readline'; 

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default webhook URL
const WEBHOOK_URL = 'http://localhost:3000/api/payments/webhook';

// Ask for the order ID
rl.question('Enter the order ID (or press Enter to generate a random one): ', async (orderId) => {
  // If no order ID is provided, generate a random one
  if (!orderId) {
    orderId = randomUUID();
    console.log(`Using generated order ID: ${orderId}`);
  }

  // Ask for the amount
  rl.question('Enter the payment amount in cents (or press Enter for default 10000 cents = 100€): ', async (amountStr) => {
    const amount = amountStr ? parseInt(amountStr, 10) : 10000;
    
    // Ask for the failure state
    rl.question('Enter the failure state (2=rejected, 3=expired, 4=cancelled, or press Enter for default 2): ', async (stateStr) => {
      const state = stateStr ? parseInt(stateStr, 10) : 2;
      
      // Generate a mock bank order code
      const bankOrderCode = `MOCK-${Date.now()}`;
      
      // Create the webhook payload for a failed payment
      const webhookPayload = {
        status: 'failed',
        data: {
          state: state, // 2=rejected, 3=expired, 4=cancelled
          reference: orderId,
          originalCurrencyAmount: amount,
          bankOrderCode: bankOrderCode,
          signaturev2: 'mock-signature', // In development, we'll bypass signature verification
          currency: 'EUR',
          amount: amount,
          concept: `Test payment for order ${orderId}`,
          description: 'Mock webhook for testing',
          createdAt: new Date().toISOString(),
          failureReason: getFailureReason(state)
        }
      };

      console.log('\nSending webhook payload:');
      console.log(JSON.stringify(webhookPayload, null, 2));
      
      try {
        // Send the webhook request
        const response = await axios.post(WEBHOOK_URL, webhookPayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\nWebhook response:');
        console.log(`Status: ${response.status}`);
        console.log(`Data: ${JSON.stringify(response.data)}`);
        console.log('\nSuccess! The payment has been marked as failed.');
        console.log(`You can now check the payment status for order: ${orderId}`);
      } catch (error) {
        console.error('\nError sending webhook:');
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          console.error(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
          console.error(error.message);
        }
        console.error('\nMake sure your server is running at http://localhost:3000');
      }
      
      rl.close();
    });
  });
});

// Helper function to get a failure reason based on the state
function getFailureReason(state) {
  switch (state) {
    case 2:
      return 'Payment was rejected by the payment processor';
    case 3:
      return 'Payment link has expired';
    case 4:
      return 'Payment was cancelled by the user';
    default:
      return 'Unknown failure reason';
  }
}
