import dotenv from 'dotenv';
import { Tropipay } from '@yosle/tropipayjs';
import { randomUUID } from 'crypto';

// Cargar variables de entorno
dotenv.config();

class TropiPayService {
  static instance;
  tropipaySDK;

  constructor() {
    if (TropiPayService.instance) {
      return TropiPayService.instance;
    }

    // If mock payment is enabled, we don't need real credentials
    if (process.env.MOCK_PAYMENT !== 'true') {
      if (!process.env.TROPIPAY_CLIENT_ID || !process.env.TROPIPAY_CLIENT_SECRET) {
        console.error('Faltan credenciales de TropiPay en las variables de entorno');
        throw new Error('Faltan credenciales de TropiPay');
      }

      this.tropipaySDK = new Tropipay({
        clientId: process.env.TROPIPAY_CLIENT_ID,
        clientSecret: process.env.TROPIPAY_CLIENT_SECRET,
        serverMode: process.env.NODE_ENV === 'production' ? 'Production' : 'Development'
      });
    }

    console.log('TropiPay Service inicializado en:', process.env.NODE_ENV, 
                process.env.MOCK_PAYMENT === 'true' ? '(Mock Mode)' : '');

    // Guardamos la instancia en la clase para asegurar el singleton
    TropiPayService.instance = this;
  }

  async createPaymentLink(paymentData) {
    try {
      // If mock payment is enabled, return mock response
      if (process.env.MOCK_PAYMENT === 'true') {
        console.log('Using mock payment response');
        
        // Generate random IDs using Node's crypto module
        const mockId = randomUUID();
        const mockUserId = randomUUID();
        const mockHash = Math.random().toString(36).substring(2, 10);
        
        return {
          success: true,
          id: mockId,
          saveToken: false,
          reference: paymentData.reference,
          concept: paymentData.concept,
          description: paymentData.description,
          amount: paymentData.amount,
          currency: paymentData.currency,
          singleUse: true,
          favorite: false,
          reasonId: 4,
          reasonDes: null,
          expirationDays: 0,
          userId: mockUserId,
          lang: paymentData.lang || 'es',
          imageBase: null,
          state: 1,
          urlSuccess: paymentData.urlSuccess,
          urlFailed: paymentData.urlFailed,
          urlNotification: paymentData.urlNotification,
          expirationDate: null,
          serviceDate: null,
          hasClient: true,
          credentialId: 141261,
          force3ds: false,
          origin: 2,
          paymentcardType: 1,
          strictPostalCodeCheck: false,
          strictAddressCheck: false,
          destinationCurrency: paymentData.currency,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          qrImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhE",
          shortUrl: `https://tppay.me/${mockHash}`,
          paymentUrl: `https://tppay.me/${mockHash}`,
          accountId: 793,
          bankOrderCode: Math.random().toString().substring(2, 14),
          rawUrlPayment: `https://tppay.me/${mockHash}`,
          giftcard: null
        };
      }

      const payload = {
        reference: paymentData.reference,
        concept: paymentData.concept,
        description: paymentData.description,
        currency: paymentData.currency || 'USD',
        amount: Math.round(paymentData.amount),
        lang: 'es',
        urlSuccess: paymentData.urlSuccess,
        urlFailed: paymentData.urlFailed,
        urlNotification: paymentData.urlNotification,
        client: paymentData.client,
        directPayment: true,
        favorite: false,
        singleUse: true,
        reasonId: 4, // Pago de servicio
        expirationDays: 1,
        serviceDate: new Date().toISOString()
      };

      console.log('Payload de pago enviado a TropiPay:', JSON.stringify(payload, null, 2));

      const paymentcard = await this.tropipaySDK.paymentCards.create(payload);

      console.log('Respuesta de TropiPay:', paymentcard);
      return {
        success: true,
        ...paymentcard,
        // Ensure shortUrl is always present
        shortUrl: paymentcard.shortUrl || `https://tppay.me/${paymentcard.hash}`
      };
    } catch (error) {
      console.error('Error al crear el pago en TropiPay:', error);
      throw error;
    }
  }
}

// Exportamos solo UNA instancia del servicio
export default new TropiPayService();