import express from 'express';
const router = express.Router();
import TropiPayService from '../services/tropipay_selector.js';
import { requireAuth } from '../middleware/auth.js';
import { sendOrderConfirmationEmail } from '../services/brevo_email.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const urlNotification = process.env.NOTIFICATION_URL || `${SERVER_URL}/api/payments/webhook`;

// Crear link de pago de TropiPay
router.post('/create-payment-link', requireAuth, async (req, res) => {
    try {
        const {
            reference,
            concept,
            amount,
            currency,
            description,
            urlSuccess,
            urlFailed,
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
            amount: Math.round(amount), // Amount should already be in cents from the frontend
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
                countryIso: client.countryIso || 'ES', // Default to Spain
                termsAndConditions: true
            } : undefined,
            directPayment: true,
            favorite: false,
            singleUse: true,
            reasonId: 4, // Service payment
            expirationDays: 1
        };

        // Call TropiPay API
        const result = await TropiPayService.createPaymentLink(payload);

        // Send response with proper headers
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Content-Type': 'application/json'
        });

        // Ensure we're sending a proper JSON response
        res.json({
            success: true,
            ...result,
            // Ensure shortUrl is always present
            shortUrl: result.shortUrl || `https://tppay.me/${result.hash}`
        });
    } catch (error) {
        console.error('Error creating TropiPay payment link:', error);
        res.status(500).json({
            success: false,
            error: 'Error creando link de pago'
        });
    }
});



// Webhook de TropiPay
router.post("/webhook", async (req, res) => {
    // Process the received data
    console.log("Received webhook payload:", req.body);
    const { status, data } = req.body;
    if (!status || !data) {
        return res.status(400).json({
            message: "Invalid payload",
        });
    }

    const isVerifiedPayload = TropiPayService.verifyPayment(
        data.originalCurrencyAmount,
        data.bankOrderCode,
        data.signaturev3 || data.signaturev2 // Support both signature versions
    );

    if (!isVerifiedPayload) {
        // maybe use a logger like winston
        console.error("Invalid signature");

        // if you provide
        return res.status(400).json({
            message: "Invalid signature",
        });
    }

    try {
        // Save and process asynchronously the payment here
        // update database, etc. if you have some long blocking operations
        // at this point. better use workers, queues, etc
        
        // Get order data from the database using the reference from the payment data
        // This is a placeholder - you'll need to implement the actual database query
        const orderData = await getOrderDataFromDatabase(data.reference);
        
        if (orderData && status === 'success') {
            // Send order confirmation email
            try {
                await sendOrderConfirmationEmail({
                    email: orderData.email,
                    name: orderData.name,
                    orderId: orderData.orderId,
                    orderDate: new Date().toLocaleDateString('es-ES'),
                    paymentMethod: 'TropiPay',
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
    } catch (err) {
        console.error('Error processing webhook:', err);
    } finally {
        return res.status(200).send("Webhook received and processed successfully");
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
        orderId: reference,
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
