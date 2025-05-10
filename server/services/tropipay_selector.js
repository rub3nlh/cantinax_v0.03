import dotenv from 'dotenv';
import TropiPaySDKService from './tropipay.js';
import TropiPayAPIService from './tropipay_api.js';

// Cargar variables de entorno
dotenv.config();

// Seleccionar el servicio según la variable de entorno
const tropipayService = process.env.TROPIPAY_TYPE === 'API' 
  ? TropiPayAPIService 
  : TropiPaySDKService;

console.log(`Usando servicio TropiPay: ${process.env.TROPIPAY_TYPE === 'API' ? 'API REST' : 'SDK'}`);

export default tropipayService;
