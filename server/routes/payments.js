import express from 'express';
const router = express.Router();
import TropiPayService from '../services/tropipay_selector.js';
import { requireAuth } from '../middleware/auth.js';

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
router.post("/webhook", (req, res) => {
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
    } catch (err) {
        // ...
    } finally {
        return res.status(200).send("Webhook received and processed successfully");
    }

    // Send a response ASAP
});

export default router;
