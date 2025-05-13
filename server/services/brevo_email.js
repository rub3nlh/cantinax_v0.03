/**
 * Brevo Email Service
 * 
 * This service handles sending transactional emails using Brevo's API.
 * It provides functions for sending different types of emails using HTML templates.
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Initialize environment variables
dotenv.config();

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template directory
const TEMPLATE_DIR = path.join(__dirname, '../../email_templates');

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY; 
const BREVO_API_URL = 'https://api.brevo.com/v3';

/**
 * Read and process an email template
 * 
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {Object} params - Parameters to replace in the template
 * @returns {Promise<string>} - Promise resolving to the processed HTML content
 */
const processTemplate = async (templateName, params) => {
  try {
    // Read the template file
    const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
    const templateContent = await fs.promises.readFile(templatePath, 'utf8');
    
    // Replace template variables with actual values
    let processedContent = templateContent;
    
    // Replace each parameter in the template
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{ \\.${key} \\}\\}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });
    
    return processedContent;
  } catch (error) {
    console.error(`Error processing template ${templateName}:`, error);
    throw error;
  }
};

/**
 * Send an email using a template
 * 
 * @param {Object} options - Email options
 * @param {Array} options.to - Recipient(s) email address and name
 * @param {Object} options.sender - Sender email address and name
 * @param {Object} options.replyTo - Reply-to email address
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlContent - HTML content of the email
 * @returns {Promise} - Promise resolving to the API response
 */
const sendEmail = async (options) => {
  try {
    const defaultSender = { 
      name: 'CantinaXL', 
      email: 'soporte@cantinaxl.com' 
    };

    const payload = {
      to: options.to,
      sender: options.sender || defaultSender,
      replyTo: options.replyTo || defaultSender,
      subject: options.subject,
      htmlContent: options.htmlContent
    };
    
    console.log('Sending payload to Brevo API:', JSON.stringify(payload, null, 2));

    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
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
        // If the response is not JSON, get the text instead
        const errorText = await response.text();
        errorMessage = `Non-JSON response: ${errorText.substring(0, 100)}...`;
      }
      throw new Error(`API error: ${response.status} - ${errorMessage}`);
    }

    // Parse the response as JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      throw new Error(`Failed to parse response as JSON. Response: ${responseText.substring(0, 100)}...`);
    }
    console.log('Email sent successfully. Message ID:', data.messageId);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a confirmation email to a user
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.confirmationUrl - URL for email confirmation
 * @returns {Promise} - Promise resolving to the API response
 */
const sendConfirmationEmail = async (options) => {
  // Process the template with parameters
  const htmlContent = await processTemplate('confirmEmail', {
    ConfirmationURL: options.confirmationUrl
  });

  // Send the email
  return sendEmail({
    to: [{ email: options.email, name: options.name }],
    subject: 'Confirma tu email - CantinaXL',
    htmlContent: htmlContent
  });
};

/**
 * Send a password reset email to a user
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.confirmationUrl - URL for password reset
 * @returns {Promise} - Promise resolving to the API response
 */
const sendPasswordResetEmail = async (options) => {
  // Process the template with parameters
  const htmlContent = await processTemplate('resetPassword', {
    ConfirmationURL: options.confirmationUrl
  });

  // Send the email
  return sendEmail({
    to: [{ email: options.email, name: options.name }],
    subject: 'Recupera tu contraseña - CantinaXL',
    htmlContent: htmlContent
  });
};

/**
 * Send an order confirmation email to a user
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.orderId - Order ID
 * @param {string} options.orderDate - Order date
 * @param {string} options.paymentMethod - Payment method
 * @param {string} options.deliveryAddress - Delivery address
 * @param {string} options.packageName - Package name
 * @param {number} options.packageQuantity - Package quantity
 * @param {number} options.packagePrice - Package price
 * @param {Array} options.meals - Array of meal objects with name and description
 * @param {string} options.discountCode - Discount code (optional)
 * @param {number} options.discountAmount - Discount amount (optional)
 * @param {number} options.totalAmount - Total amount
 * @param {Array} options.deliveryDates - Array of delivery date objects with date and mealCount
 * @param {string} options.orderDetailsUrl - URL for order details
 * @returns {Promise} - Promise resolving to the API response
 */
const sendOrderConfirmationEmail = async (options) => {
  // Process the template with parameters
  const htmlContent = await processTemplate('orderConfirmation', {
    CustomerName: options.name,
    OrderID: options.orderId,
    OrderDate: options.orderDate,
    PaymentMethod: options.paymentMethod,
    DeliveryAddress: options.deliveryAddress,
    PackageName: options.packageName,
    PackageQuantity: options.packageQuantity.toString(),
    PackagePrice: options.packagePrice.toString(),
    Meals: JSON.stringify(options.meals),
    DiscountCode: options.discountCode || '',
    DiscountAmount: options.discountAmount ? options.discountAmount.toString() : '',
    TotalAmount: options.totalAmount.toString(),
    DeliveryDates: JSON.stringify(options.deliveryDates),
    OrderDetailsURL: options.orderDetailsUrl
  });

  // Send the email
  return sendEmail({
    to: [{ email: options.email, name: options.name }],
    subject: 'Confirmación de tu pedido - CantinaXL',
    htmlContent: htmlContent
  });
};

/**
 * Send a delivery reminder email to a user
 * 
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.name - Recipient name
 * @param {string} options.deliveryDate - Delivery date
 * @param {string} options.deliveryTimeRange - Delivery time range
 * @param {string} options.orderId - Order ID
 * @param {string} options.deliveryAddress - Delivery address
 * @param {string} options.deliveryContact - Delivery contact
 * @param {Array} options.meals - Array of meal objects with name and description
 * @param {string} options.orderDetailsUrl - URL for order details
 * @returns {Promise} - Promise resolving to the API response
 */
const sendDeliveryReminderEmail = async (options) => {
  // Process the template with parameters
  const htmlContent = await processTemplate('deliveryReminder', {
    CustomerName: options.name,
    DeliveryDate: options.deliveryDate,
    DeliveryTimeRange: options.deliveryTimeRange,
    OrderID: options.orderId,
    DeliveryAddress: options.deliveryAddress,
    DeliveryContact: options.deliveryContact,
    Meals: JSON.stringify(options.meals),
    OrderDetailsURL: options.orderDetailsUrl
  });

  // Send the email
  return sendEmail({
    to: [{ email: options.email, name: options.name }],
    subject: 'Recordatorio de entrega para mañana - CantinaXL',
    htmlContent: htmlContent
  });
};

export {
  sendConfirmationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendDeliveryReminderEmail
};
