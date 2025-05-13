/**
 * Brevo Email Service Example
 * 
 * This script demonstrates how to use the Brevo email service to send different types of emails.
 * Before running this example, make sure to:
 * 1. Install node-fetch: npm install node-fetch
 */

import * as brevoEmail from '../services/brevo_email.js';

// Example data for testing
const testUser = {
  email: 'ruben.lh+brevo@gmail.com',
  name: 'Ruben Test User'
};

/**
 * Example: Send confirmation email
 */
async function sendConfirmationEmailExample() {
  try {
    console.log('Sending confirmation email...');
    
    const result = await brevoEmail.sendConfirmationEmail({
      email: testUser.email,
      name: testUser.name,
      confirmationUrl: 'https://cantinaxl.com/confirm?token=abc123'
    });
    
    console.log('Confirmation email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

/**
 * Example: Send password reset email
 */
async function sendPasswordResetEmailExample() {
  try {
    console.log('Sending password reset email...');
    
    const result = await brevoEmail.sendPasswordResetEmail({
      email: testUser.email,
      name: testUser.name,
      confirmationUrl: 'https://cantinaxl.com/reset-password?token=xyz789'
    });
    
    console.log('Password reset email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}

/**
 * Example: Send order confirmation email
 */
async function sendOrderConfirmationEmailExample() {
  try {
    console.log('Sending order confirmation email...');
    
    const result = await brevoEmail.sendOrderConfirmationEmail({
      email: testUser.email,
      name: testUser.name,
      orderId: 'ORD-12345',
      orderDate: '13/05/2025',
      paymentMethod: 'Tarjeta de crédito',
      deliveryAddress: 'Calle Ejemplo 123, Madrid, 28001',
      packageName: 'Paquete Semanal',
      packageQuantity: 1,
      packagePrice: 59.99,
      meals: [
        { name: 'Pollo al curry', description: 'Pollo con salsa de curry y arroz basmati' },
        { name: 'Ensalada César', description: 'Lechuga romana, pollo, crutones y aderezo César' },
        { name: 'Pasta Boloñesa', description: 'Espaguetis con salsa de carne y tomate' }
      ],
      discountCode: 'WELCOME10',
      discountAmount: 5.99,
      totalAmount: 54.00,
      deliveryDates: [
        { date: '15/05/2025', mealCount: 1 },
        { date: '17/05/2025', mealCount: 2 }
      ],
      orderDetailsUrl: 'https://cantinaxl.com/orders/ORD-12345'
    });
    
    console.log('Order confirmation email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
  }
}

/**
 * Example: Send delivery reminder email
 */
async function sendDeliveryReminderEmailExample() {
  try {
    console.log('Sending delivery reminder email...');
    
    const result = await brevoEmail.sendDeliveryReminderEmail({
      email: testUser.email,
      name: testUser.name,
      deliveryDate: '14/05/2025',
      deliveryTimeRange: '10:00 - 14:00',
      orderId: 'ORD-12345',
      deliveryAddress: 'Calle Ejemplo 123, Madrid, 28001',
      deliveryContact: '+34 612 345 678',
      meals: [
        { name: 'Pollo al curry', description: 'Pollo con salsa de curry y arroz basmati' },
        { name: 'Ensalada César', description: 'Lechuga romana, pollo, crutones y aderezo César' }
      ],
      orderDetailsUrl: 'https://cantinaxl.com/orders/ORD-12345'
    });
    
    console.log('Delivery reminder email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending delivery reminder email:', error);
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('Running Brevo email examples...\n');
  
  // Uncomment the examples you want to run
  await sendConfirmationEmailExample();
  console.log('\n');
  
  await sendPasswordResetEmailExample();
  console.log('\n');
  
  await sendOrderConfirmationEmailExample();
  console.log('\n');
  
  await sendDeliveryReminderEmailExample();
  
  console.log('\nAll examples completed!');
}

// Run the examples if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  sendConfirmationEmailExample,
  sendPasswordResetEmailExample,
  sendOrderConfirmationEmailExample,
  sendDeliveryReminderEmailExample,
  runAllExamples
};
