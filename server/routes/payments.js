import express from 'express';
import TropiPayService from '../services/tropipay_selector.js';
import { requireAuth } from '../middleware/auth.js';
import { sendOrderConfirmationEmail } from '../services/brevo_email.js';

const router = express.Router();

// Configuración de URLs
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
    try {
        // Process the received data
        console.log("Received webhook payload:", req.body);
        const { status, data } = req.body;
        
        if (!status || !data) {
            console.error("Invalid webhook payload: missing status or data");
            return res.status(400).json({
                message: "Invalid payload",
            });
        }

        // Check if we're in test mode (for automated tests)
        const isTestMode = req.headers['x-test-mode'] === 'true';
        
        // Verify the payment signature unless we're in test mode
        if (!isTestMode) {
            const isVerifiedPayload = await TropiPayService.verifyPayment(
                data.originalCurrencyAmount,
                data.bankOrderCode,
                data.signaturev3 || data.signaturev2 // Support both signature versions
            );

            if (!isVerifiedPayload) {
                console.error("Invalid signature in webhook");
                return res.status(400).json({
                    message: "Invalid signature",
                });
            }
            
            console.log("Webhook signature verified successfully");
        } else {
            console.log("Test mode detected, bypassing signature verification");
        }

        // Get the reference from the webhook data
        const reference = data.reference;
        if (!reference) {
            console.error("Missing reference in webhook data");
            return res.status(400).json({
                message: "Missing reference",
            });
        }

        // Find the payment order by reference
        const paymentOrder = await findPaymentOrder(reference);
        if (!paymentOrder) {
            console.error(`No payment order found for reference: ${reference}`);
            return res.status(404).json({
                message: "Payment order not found",
            });
        }

        // Get the order data
        const orderData = await getOrderData(paymentOrder.order_id);
        if (!orderData) {
            console.error(`Order not found for ID: ${paymentOrder.order_id}`);
            return res.status(404).json({
                message: "Order not found",
            });
        }

        // Update payment order status based on webhook status
        const paymentSuccessful = status === 'OK';
        await updatePaymentOrderStatus(paymentOrder.id, paymentSuccessful, data);
        
        // If payment was successful, send confirmation email and register order in Brevo
        if (paymentSuccessful) {
            try {
                await sendOrderConfirmationEmail({
                    email: orderData.email,
                    name: orderData.name,
                    orderId: orderData.orderId,
                    deliveryAddress: orderData.deliveryAddress,
                    packageName: orderData.packageName,
                    packageQuantity: orderData.packageQuantity,
                    packagePrice: orderData.packagePrice,
                    discountCode: orderData.discountCode,
                    discountAmount: orderData.discountAmount,
                    totalAmount: orderData.totalAmount,
                    deliveryDates: orderData.deliveryDates
                });
                
                console.log(`Order confirmation email sent for order ${orderData.orderId}`);
                
                // Register order in Brevo for purchase statistics
                try {
                    const { registerOrder } = await import('../services/brevo_stats.js');
                    await registerOrder({
                        orderId: orderData.orderId,
                        email: orderData.email,
                        packageId: orderData.packageName.replace(/\s+/g, '-').toLowerCase(), // Convert to ID format
                        packageQuantity: orderData.packageQuantity || 1,
                        packagePrice: orderData.packagePrice,
                        totalAmount: orderData.totalAmount
                    });
                    console.log(`Order ${orderData.orderId} registered in Brevo for statistics`);
                } catch (brevoError) {
                    console.error('Error registering order in Brevo:', brevoError);
                    // Continue processing even if Brevo registration fails
                }
            } catch (emailError) {
                console.error('Error sending order confirmation email:', emailError);
                // Continue processing even if email fails
            }
        } else {
            console.error(`Payment failed for order ${orderData.orderId}. Status: ${status}`);
        }
        
        return res.status(200).json({
            message: "Webhook processed successfully",
            orderStatus: paymentSuccessful ? "completed" : "failed"
        });
    } catch (err) {
        console.error('Error processing webhook:', err);
        return res.status(500).json({
            message: "Error processing webhook",
        });
    }
});

/**
 * Find a payment order by reference or order_id
 * @param {string} reference - The payment reference or order_id
 * @returns {Promise<Object|null>} - The payment order or null if not found
 */
async function findPaymentOrder(reference) {
    try {
        console.log(`Finding payment order for reference: ${reference}`);
        
        // Create Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials in environment variables');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // First, try to find by reference
        let { data: paymentOrderByRef, error: refError } = await supabase
            .from('payment_orders')
            .select('id, order_id, status')
            .eq('reference', reference)
            .single();
        
        if (!refError && paymentOrderByRef) {
            console.log(`Found payment order by reference: ${reference}`, paymentOrderByRef);
            return paymentOrderByRef;
        }
        
        // If not found by reference, try by order_id
        const { data: paymentOrderByOrderId, error: orderIdError } = await supabase
            .from('payment_orders')
            .select('id, order_id, status')
            .eq('order_id', reference)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (!orderIdError && paymentOrderByOrderId && paymentOrderByOrderId.length > 0) {
            console.log(`Found payment order by order_id: ${reference}`, paymentOrderByOrderId[0]);
            return paymentOrderByOrderId[0];
        }
        
        console.error(`No payment order found for reference or order_id: ${reference}`);
        return null;
    } catch (error) {
        console.error(`Error finding payment order:`, error);
        throw error;
    }
}

/**
 * Get order data by order ID
 * @param {string} orderId - The order ID
 * @returns {Promise<Object|null>} - The order data or null if not found
 */
async function getOrderData(orderId) {
    try {
        console.log(`Getting order data for ID: ${orderId}`);
        
        // Create Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials in environment variables');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Get the order data
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                id,
                user_id,
                status,
                total,
                package_id,
                package_data,
                delivery_address_data,
                created_at,
                order_deliveries (
                    id,
                    scheduled_date,
                    status,
                    meals_count,
                    delivery_meals (
                        meal_id
                    )
                )
            `)
            .eq('id', orderId)
            .single();
        
        if (orderError) {
            console.error('Error fetching order:', orderError);
            return null;
        }
        
        if (!orderData) {
            console.error(`No order found with ID: ${orderId}`);
            return null;
        }
        
        // Get user data
        const { data: userData, error: userError } = await supabase
            .auth.admin.getUserById(orderData.user_id);
            
        if (userError) {
            console.error('Error fetching user data:', userError);
            return null;
        }
        
        // Transform the data to match the expected format for the email
        const packageData = orderData.package_data || {};
        const addressData = orderData.delivery_address_data || {};
        const userMetadata = userData?.user?.user_metadata || {};
        
        return {
            email: userMetadata.email,
            name: userMetadata.display_name,
            orderId: orderData.id,
            deliveryAddress: `${addressData.address || ''}, ${addressData.municipality || ''}, ${addressData.province || ''}`,
            packageName: packageData.name || 'Paquete',
            packageQuantity: 1,
            packagePrice: packageData.price || 0,
            discountCode: '', // No discount code in the schema
            discountAmount: 0, // No discount amount in the schema
            totalAmount: orderData.total || 0,
            deliveryDates: orderData.order_deliveries?.map(delivery => ({
                date: new Date(delivery.scheduled_date).toLocaleDateString('es-ES'),
                mealCount: delivery.meals_count
            })) || []
        };
    } catch (error) {
        console.error(`Error in getOrderData:`, error);
        throw error;
    }
}

/**
 * Update payment order status
 * @param {string} paymentOrderId - The payment order ID
 * @param {boolean} success - Whether the payment was successful
 * @param {Object} paymentData - The payment data from TropiPay
 * @returns {Promise<Object|null>} - The updated payment order or null if not found
 */
async function updatePaymentOrderStatus(paymentOrderId, success, paymentData) {
    try {
        console.log(`Updating payment order status for ID: ${paymentOrderId}, success: ${success}`);
        
        // Create Supabase client
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase credentials in environment variables');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Update the payment order
        const { data: updatedPayment, error: updateError } = await supabase
            .from('payment_orders')
            .update({
                status: success ? 'completed' : 'failed',
                completed_at: new Date().toISOString(),
                error_message: success ? null : 'Payment failed'
            })
            .eq('id', paymentOrderId)
            .select();
        
        if (updateError) {
            console.error(`Error updating payment order ${paymentOrderId}:`, updateError);
            return null;
        }
        
        if (!updatedPayment || updatedPayment.length === 0) {
            console.error(`No payment order found with ID: ${paymentOrderId}`);
            return null;
        }
        
        console.log(`Payment order ${paymentOrderId} updated successfully`);
        return updatedPayment[0];
    } catch (error) {
        console.error(`Error in updatePaymentOrderStatus:`, error);
        throw error;
    }
}

export default router;
