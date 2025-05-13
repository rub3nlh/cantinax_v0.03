import express from 'express';
import tropiPayService from '../services/tropipay_selector.js';
import { sendOrderConfirmationEmail } from '../services/brevo_email.js';

const router = express.Router();

// Mock de datos de tarjetas válidas para pruebas
const VALID_TEST_CARDS = [
  { number: '4242424242424242', expiry: '12/25', cvv: '123' }, // Visa
  { number: '5555555555554444', expiry: '12/25', cvv: '123' }, // Mastercard
];

// Procesar pago con tarjeta
router.post('/process-card', async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, amount } = req.body;
    console.log('Processing card payment:', { cardNumber, expiryDate, amount });

    // Simulamos un delay para imitar el procesamiento del pago
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validación básica
    const isValidCard = VALID_TEST_CARDS.some(
      card => card.number === cardNumber.replace(/\s/g, '')
    );
    if (!isValidCard) {
      console.warn('Invalid card number:', cardNumber);
      return res.status(400).json({
        success: false,
        error: 'Tarjeta inválida o rechazada'
      });
    }

    // Simulamos una respuesta exitosa
    const transactionId = `card_${Math.random().toString(36).substr(2, 9)}`;
    console.log('Payment processed successfully:', { transactionId, amount });

    // Get order data from the request or database
    // This is a placeholder - you'll need to implement the actual data retrieval
    const orderData = req.body.orderData || await getOrderDataFromDatabase(req.body.reference);
    
    if (orderData) {
      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          email: orderData.email,
          name: orderData.name,
          orderId: orderData.orderId,
          orderDate: new Date().toLocaleDateString('es-ES'),
          paymentMethod: 'Tarjeta de crédito',
          deliveryAddress: orderData.deliveryAddress,
          packageName: orderData.packageName,
          packageQuantity: orderData.packageQuantity,
          packagePrice: orderData.packagePrice,
          meals: orderData.meals,
          discountCode: orderData.discountCode,
          discountAmount: orderData.discountAmount,
          totalAmount: orderData.totalAmount,
          deliveryDates: orderData.deliveryDates,
          orderDetailsUrl: `${process.env.CLIENT_URL || 'https://cantinaxl.com'}/orders/${orderData.orderId}`
        });
        
        console.log(`Order confirmation email sent for order ${orderData.orderId}`);
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
        // Continue processing even if email fails
      }
    }

    res.json({
      success: true,
      transactionId,
      amount,
      message: 'Pago procesado correctamente'
    });
  } catch (error) {
    console.error('Error processing card payment:', error);
    res.status(500).json({
      success: false,
      error: 'Error procesando el pago'
    });
  }
});

// Crear link de pago de TropiPay
router.post('/create-payment-link', async (req, res) => {
  try {
    const {
      reference,
      concept,
      amount,
      currency,
      description,
      urlSuccess,
      urlFailed,
      urlNotification,
      client
    } = req.body;

    console.log('Creating TropiPay payment link:', {
      reference,
      concept,
      amount,
      currency
    });

    // Validación básica
    if (!reference || !concept || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

    // Prepare payload according to TropiPay docs
    const payload = {
      reference,
      concept,
      description,
      currency,
      amount: Math.round(amount), // TropiPay expects amount in cents
      lang: 'es',
      urlSuccess,
      urlFailed,
      urlNotification,
      client: client ? {
        name: client.name,
        lastName: client.lastName,
        address: client.address,
        phone: client.phone,
        email: client.email,
        countryIso: client.countryIso, // Use countryIso for TropiPay API
        termsAndConditions: true
      } : undefined,
      directPayment: true,
      favorite:false,
      singleUse: true,
      reasonId: 4, // Service payment
      expirationDays: 1
    };

    // Log environment variables for debugging
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      TROPIPAY_CLIENT_ID: process.env.TROPIPAY_CLIENT_ID ? 'Set' : 'Not set',
      TROPIPAY_CLIENT_SECRET: process.env.TROPIPAY_CLIENT_SECRET ? 'Set' : 'Not set'
    });

    // Call TropiPay API
    const result = await tropiPayService.createPaymentLink(payload);

    // Send response with Cache-Control headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json(result);
  } catch (error) {
    console.error('Error creating TropiPay payment link:', error);
    res.status(500).json({
      success: false,
      error: 'Error creando link de pago'
    });
  }
});

/**
 * Helper function to get order data from the database
 * This is a placeholder - implement the actual database query
 * @param {string} reference - The order reference
 * @returns {Promise<Object>} - The order data
 */
async function getOrderDataFromDatabase(reference) {
  // This is where you would query your database to get the order data
  // For example, using Supabase or another database client
  
  // Example implementation (replace with actual database query):
  // const { data, error } = await supabase
  //     .from('orders')
  //     .select('*')
  //     .eq('reference', reference)
  //     .single();
  
  // if (error) throw error;
  // return data;
  
  // For now, return mock data for testing
  console.log(`Getting order data for reference: ${reference}`);
  return {
    email: 'customer@example.com',
    name: 'Cliente Ejemplo',
    orderId: reference || `ORD-${Math.random().toString(36).substring(2, 10)}`,
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
    ]
  };
}

export default router;
