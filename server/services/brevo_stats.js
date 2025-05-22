/**
 * Brevo Statistics Service
 * 
 * Este servicio maneja la integración con Brevo para estadísticas de compra.
 * Proporciona funciones para registrar productos y órdenes en Brevo.
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Inicializar variables de entorno
dotenv.config();

// Configuración de la API de Brevo
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

/**
 * Registra productos (paquetes) en Brevo
 * 
 * @param {Array} products - Array de productos a registrar
 * @returns {Promise} - Promesa que se resuelve con la respuesta de la API
 */
const registerProducts = async (products) => {
  try {
    const payload = {
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        url: `https://cantinaxl.com/packages/${product.id}`,
        imageUrl: product.imageUrl || '',
        price: product.price,
        categories: ['meal-package'],
        metadata: {
          meals: product.meals,
          description: product.description
        }
      }))
    };

    console.log('Registering products in Brevo:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BREVO_API_URL}/products/batch`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (jsonError) {
        // Si la respuesta no es JSON, obtener el texto en su lugar
        const errorText = await response.text();
        errorMessage = `Non-JSON response: ${errorText.substring(0, 100)}...`;
      }
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    // Analizar la respuesta como JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      throw new Error(`Failed to parse response as JSON. Response: ${responseText.substring(0, 100)}...`);
    }
    console.log('Products registered successfully in Brevo:', data);
    return data;
  } catch (error) {
    console.error('Error registering products in Brevo:', error);
    throw error;
  }
};

/**
 * Registra una orden en Brevo
 * 
 * @param {Object} orderData - Datos de la orden
 * @returns {Promise} - Promesa que se resuelve con la respuesta de la API
 */
const registerOrder = async (orderData) => {
  try {
    // Crear fecha en formato UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
    const now = new Date();
    // Formato exacto requerido por Brevo según la documentación
    const formattedDate = now.toISOString();
    
    // Estructura del payload según el ejemplo de la documentación
    const payload = {
      "historical": true,
      "orders": [
        {
          "identifiers": {
            "email_id": orderData.email
          },
          "id": orderData.orderId,
          "createdAt": formattedDate,
          "updatedAt": formattedDate,
          "status": "completed",
          "amount": orderData.totalAmount,
          "storeId": "cantinaxl",
          "coupons": [
            orderData.coupon || "",
          ],
          "products": [
            {
              "productId": orderData.packageId,
              "quantity": orderData.packageQuantity || 1,
              "price": orderData.packagePrice
            }
          ]
        }
      ]
    };

    console.log('Registering order in Brevo:', JSON.stringify(payload, null, 2));

    // Usar el endpoint correcto según la documentación
    const response = await fetch(`${BREVO_API_URL}/orders/status/batch`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = JSON.stringify(errorData);
      } catch (jsonError) {
        // Si la respuesta no es JSON, obtener el texto en su lugar
        const errorText = await response.text();
        errorMessage = `Non-JSON response: ${errorText.substring(0, 100)}...`;
      }
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    // Analizar la respuesta como JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      throw new Error(`Failed to parse response as JSON. Response: ${responseText.substring(0, 100)}...`);
    }
    console.log('Order registered successfully in Brevo:', data);
    return data;
  } catch (error) {
    console.error('Error registering order in Brevo:', error);
    throw error;
  }
};

export {
  registerProducts,
  registerOrder
};
