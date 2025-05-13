/**
 * Brevo Email Integration Test
 * 
 * This script tests the Brevo email integration by sending a test email for each template.
 * 
 * Usage:
 * node server/tests/test_brevo_email.js [recipient_email]
 * 
 * If no recipient email is provided, it will default to the test email in the script.
 */

import { fileURLToPath } from 'url';
import path from 'path';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default test recipient
const TEST_RECIPIENT = {
  email: 'test_cantina@mailinator.com',
  name: 'Test User'
};

/**
 * Send test emails using the updated service
 * 
 * @param {Object} recipient - Recipient object with email and name
 * @returns {Promise<void>}
 */
async function sendTestEmails(recipient) {
  try {
    console.log(`Sending test emails to ${recipient.email}...`);
    
    // Import the updated module with cache busting
    const brevoEmailModule = await import(`../services/brevo_email.js?update=${Date.now()}`);
    const brevoEmail = brevoEmailModule;
    
    // Send confirmation email
    console.log('\nSending confirmation email...');
    await brevoEmail.sendConfirmationEmail({
      email: recipient.email,
      name: recipient.name,
      confirmationUrl: 'https://cantinaxl.com/confirm?token=test123'
    });
    
    // Send password reset email
    console.log('\nSending password reset email...');
    await brevoEmail.sendPasswordResetEmail({
      email: recipient.email,
      name: recipient.name,
      confirmationUrl: 'https://cantinaxl.com/reset-password?token=test456'
    });
    
    // Send order confirmation email
    console.log('\nSending order confirmation email...');
    await brevoEmail.sendOrderConfirmationEmail({
      email: recipient.email,
      name: recipient.name,
      orderId: 'TEST-12345',
      orderDate: '13/05/2025',
      paymentMethod: 'Tarjeta de crédito (TEST)',
      deliveryAddress: 'Calle Test 123, Madrid, 28001',
      packageName: 'Paquete Test',
      packageQuantity: 1,
      packagePrice: 59.99,
      meals: [
        { name: 'Test Meal 1', description: 'Description for test meal 1' },
        { name: 'Test Meal 2', description: 'Description for test meal 2' }
      ],
      discountCode: 'TEST10',
      discountAmount: 5.99,
      totalAmount: 54.00,
      deliveryDates: [
        { date: '15/05/2025', mealCount: 1 },
        { date: '17/05/2025', mealCount: 1 }
      ],
      orderDetailsUrl: 'https://cantinaxl.com/orders/TEST-12345'
    });
    
    // Send delivery reminder email
    console.log('\nSending delivery reminder email...');
    await brevoEmail.sendDeliveryReminderEmail({
      email: recipient.email,
      name: recipient.name,
      deliveryDate: '14/05/2025',
      deliveryTimeRange: '10:00 - 14:00',
      orderId: 'TEST-12345',
      deliveryAddress: 'Calle Test 123, Madrid, 28001',
      deliveryContact: '+34 600 000 000',
      meals: [
        { name: 'Test Meal 1', description: 'Description for test meal 1' },
        { name: 'Test Meal 2', description: 'Description for test meal 2' }
      ],
      orderDetailsUrl: 'https://cantinaxl.com/orders/TEST-12345'
    });
    
    console.log('\nAll test emails sent successfully!');
  } catch (error) {
    console.error('Error sending test emails:', error);
    throw error;
  }
}

/**
 * Main function to run the test
 */
async function runTest() {
  try {
    console.log('Starting Brevo email integration test...\n');
    
    // Get recipient email from command line args or use default
    const recipientEmail = process.argv[2] || TEST_RECIPIENT.email;
    const recipient = {
      email: recipientEmail,
      name: 'Test User'
    };
    
    console.log(`Using recipient: ${recipient.email}\n`);
    
    // Send test emails
    await sendTestEmails(recipient);
    
    console.log('\nBrevo email integration test completed successfully!');
    console.log('Check your email inbox to verify the emails were received correctly.');
  } catch (error) {
    console.error('\nBrevo email integration test failed:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest();
}

export { runTest };
