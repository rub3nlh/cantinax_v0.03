import dotenv from 'dotenv';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Cargar variables de entorno
dotenv.config();

class TropiPayAPIService {
  static instance;
  apiUrl;
  clientId;
  clientSecret;
  accessToken;
  tokenExpiry;

  constructor() {
    if (TropiPayAPIService.instance) {
      return TropiPayAPIService.instance;
    }

    // If mock payment is enabled, we don't need real credentials
    if (process.env.MOCK_PAYMENT !== 'true') {
      if (!process.env.TROPIPAY_CLIENT_ID || !process.env.TROPIPAY_CLIENT_SECRET) {
        console.error('Faltan credenciales de TropiPay en las variables de entorno');
        throw new Error('Faltan credenciales de TropiPay');
      }

      this.clientId = process.env.TROPIPAY_CLIENT_ID;
      this.clientSecret = process.env.TROPIPAY_CLIENT_SECRET;
      this.apiUrl = process.env.TROPIPAY_API_URL;
    }

    console.log('TropiPay API Service inicializado en:', process.env.NODE_ENV,
      process.env.MOCK_PAYMENT === 'true' ? '(Mock Mode)' : '');

    // Guardamos la instancia en la clase para asegurar el singleton
    TropiPayAPIService.instance = this;
  }

  /**
   * Obtiene un token de acceso para la API de TropiPay
   * @returns {Promise<string>} Token de acceso
   */
  async getAccessToken() {
    try {
      // Si ya tenemos un token válido, lo devolvemos
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Si estamos en modo mock, devolvemos un token falso
      if (process.env.MOCK_PAYMENT === 'true') {
        this.accessToken = 'mock_access_token';
        this.tokenExpiry = new Date(Date.now() + 3600 * 1000); // 1 hora
        return this.accessToken;
      }

      // Obtenemos un nuevo token según la documentación proporcionada
      const response = await axios.post(`${this.apiUrl}/access/token`, {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret
      });

      if (!response.data || !response.data.access_token) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      this.accessToken = response.data.access_token;
      // Establecemos la expiración del token (normalmente 1 hora)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Error al obtener el token de acceso de TropiPay:', error);
      
      // Log more details about the error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  }

  /**
   * Crea un enlace de pago en TropiPay
   * @param {Object} paymentData Datos del pago
   * @returns {Promise<Object>} Respuesta de TropiPay
   */
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

      // Preparamos el payload para la API según la documentación actualizada
      // https://doc.tropipay.com/docs/basics/create-paymentcards
      const payload = {
        reference: paymentData.reference,
        concept: paymentData.concept,
        description: paymentData.description,
        currency: paymentData.currency || 'EUR', // Default to EUR as per documentation
        amount: Math.round(paymentData.amount), // Amount should already be in cents from the route
        lang: paymentData.lang || 'es',
        urlSuccess: paymentData.urlSuccess,
        urlFailed:  paymentData.urlFailed,
        urlNotification: process.env[`NOTIFICATION_URL_${process.env.NODE_ENV?.toUpperCase() || 'PRODUCTION'}`] || paymentData.urlNotification,
        client: paymentData.client,
        directPayment: true,
        favorite: false,
        singleUse: true,
        reasonId: 4, // Pago de servicio
        expirationDays: 1,
        serviceDate: new Date().toISOString()
      };

      console.log('Payload de pago enviado a TropiPay API:', JSON.stringify(payload, null, 2));

      // Obtenemos el token de acceso
      const token = await this.getAccessToken();

      // Realizamos la petición a la API según la documentación proporcionada
      const response = await axios.post(`${this.apiUrl}/paymentcards`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificamos la respuesta
      if (!response.data) {
        throw new Error('No se recibió respuesta de TropiPay');
      }

      const paymentcard = response.data;
      console.log('Respuesta de TropiPay API:', paymentcard);

      return {
        success: true,
        ...paymentcard
      };
    } catch (error) {
      console.error('Error al crear el pago en TropiPay API:', JSON.stringify(error, null, 2));
      
      // Log more details about the error
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
  }

  /**
   * Verifica la firma de un pago de TropiPay
   * Según la documentación: https://doc.tropipay.com/docs/tutorial-extras/verify-payments
   * 
   * @param {number} originalCurrencyAmount Monto original en centavos
   * @param {string} bankOrderCode Código de orden bancaria
   * @param {string} signaturev3 Firma v3
   * @returns {boolean} Indica si la firma es válida
   */
  verifyPayment(originalCurrencyAmount, bankOrderCode, signaturev3) {
    try {
      // Si estamos en modo mock, devolvemos true
      if (process.env.MOCK_PAYMENT === 'true') {
        return true;
      }

      // Verificación local de la firma según la documentación
      // https://doc.tropipay.com/docs/tutorial-extras/verify-payments
      
      // Obtenemos las credenciales
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Se requieren las credenciales del cliente para verificar la firma');
      }
      
      // Importamos crypto para verificar la firma
      const crypto = require('crypto');
      
      // Calculamos el SHA-1 del secreto del cliente
      const secretSha1 = crypto
        .createHash('sha1')
        .update(this.clientSecret)
        .digest('hex');
      
      // Creamos el string para verificar la firma según la fórmula:
      // signatureV3 = sha256(bankOrderCode + apiKey + sha1(apiSecret) + originalCurrencyAmount)
      const stringToVerify = `${bankOrderCode}${this.clientId}${secretSha1}${originalCurrencyAmount}`;
      
      // Calculamos el hash usando SHA-256
      const calculatedSignature = crypto
        .createHash('sha256')
        .update(stringToVerify)
        .digest('hex');
      
      // Comparamos la firma calculada con la recibida
      return calculatedSignature === signaturev3;
    } catch (error) {
      console.error('Error al verificar la firma de TropiPay:', error);
      return false;
    }
  }
}

// Exportamos solo UNA instancia del servicio
export default new TropiPayAPIService();
