/**
 * Upload Brevo Templates Utility
 * 
 * This script uploads HTML email templates to Brevo and returns their template IDs.
 * Run this script to create or update templates in Brevo.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Initialize environment variables
dotenv.config();

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY; // Note: There's a typo in the .env file (BREVEO instead of BREVO)
const BREVO_API_URL = 'https://api.brevo.com/v3';

// Template directory
const TEMPLATE_DIR = path.join(__dirname, '../../email_templates');

// Template definitions
const templates = [
  {
    name: 'CantinaXL - Email Confirmation',
    fileName: 'confirmEmail.html',
    subject: 'Confirma tu email - CantinaXL'
  },
  {
    name: 'CantinaXL - Password Reset',
    fileName: 'resetPassword.html',
    subject: 'Recupera tu contraseña - CantinaXL'
  },
  {
    name: 'CantinaXL - Order Confirmation',
    fileName: 'orderConfirmation.html',
    subject: 'Confirmación de tu pedido - CantinaXL'
  },
  {
    name: 'CantinaXL - Delivery Reminder',
    fileName: 'deliveryReminder.html',
    subject: 'Recordatorio de entrega para mañana - CantinaXL'
  }
];

/**
 * Read template file content
 * 
 * @param {string} fileName - Template file name
 * @returns {Promise<string>} - Promise resolving to file content
 */
async function readTemplateFile(fileName) {
  try {
    const filePath = path.join(TEMPLATE_DIR, fileName);
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading template file ${fileName}:`, error);
    throw error;
  }
}

/**
 * Create a template in Brevo using the REST API
 * 
 * @param {Object} template - Template definition
 * @param {string} htmlContent - HTML content of the template
 * @returns {Promise<Object>} - Promise resolving to created template
 */
async function createTemplate(template, htmlContent) {
  try {
    const payload = {
      templateName: template.name,
      subject: template.subject,
      htmlContent: htmlContent,
      isActive: true,
      sender: {
        name: 'CantinaXL',
        email: 'soporte@cantinaxl.com'
      }
    };
    
    console.log('Sending payload to Brevo API:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(`${BREVO_API_URL}/smtp/templates`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`Template "${template.name}" created with ID: ${data.id}`);
    return data;
  } catch (error) {
    console.error(`Error creating template "${template.name}":`, error);
    throw error;
  }
}

/**
 * Main function to upload all templates
 */
async function uploadTemplates() {
  try {
    console.log('Starting template upload process...');
    
    const results = [];
    
    for (const template of templates) {
      console.log(`Processing template: ${template.name}`);
      
      // Read template file
      const htmlContent = await readTemplateFile(template.fileName);
      
      // Create template in Brevo
      const result = await createTemplate(template, htmlContent);
      
      results.push({
        name: template.name,
        id: result.id,
        fileName: template.fileName
      });
    }
    
    console.log('\nTemplate upload completed successfully!');
    console.log('\nTemplate IDs for use in brevo_email.js:');
    
    // Generate code snippet for template IDs
    let codeSnippet = '// Template IDs\n';
    results.forEach(result => {
      const constName = result.fileName
        .replace('.html', '')
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '');
      
      codeSnippet += `const ${constName}_TEMPLATE_ID = ${result.id}; // ${result.name}\n`;
    });
    
    console.log(codeSnippet);
    
    return results;
  } catch (error) {
    console.error('Error uploading templates:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadTemplates();
}

export { uploadTemplates };
