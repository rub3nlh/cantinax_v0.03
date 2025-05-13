# Brevo Email Integration

This document explains how to use the Brevo email integration for sending transactional emails in CantinaXL.

## Overview

The integration uses [Brevo](https://www.brevo.com/) (formerly Sendinblue) to send transactional emails using HTML templates. The implementation includes:

1. A service for sending different types of emails
2. Example code showing how to use the email service

The service reads HTML templates from the `/email_templates` directory, processes them by replacing template variables with actual values, and sends the emails using Brevo's API.

## Setup

### 1. Install Dependencies

The node-fetch package is required for the email service to work:

```bash
npm install node-fetch
```

### 2. Environment Variables

Make sure the Brevo API key is set in your `.env` file:

```
BREVO_API_KEY=your-brevo-api-key
```

### 3. Email Templates

The email templates are located in the `/email_templates` directory. Each template is an HTML file with template variables in the format `{{ .VariableName }}`. These variables will be replaced with actual values when sending the email.

## Email Templates

The integration includes four email templates:

1. **confirmEmail.html** - Sent to users to confirm their email address after signup
2. **resetPassword.html** - Sent to users when they request a password reset
3. **orderConfirmation.html** - Sent to users after they complete an order
4. **deliveryReminder.html** - Sent to users the day before a scheduled delivery

Each template uses variables that are replaced with actual values when sending the email. For example, `{{ .ConfirmationURL }}` in the confirmEmail template is replaced with the actual confirmation URL.

The service automatically reads these templates, processes them by replacing the variables with actual values, and sends the emails using Brevo's API.

## Using the Email Service

The email service provides functions for sending each type of email. The implementation uses the Brevo REST API directly, which makes it more reliable and easier to maintain.

### Email Confirmation

```javascript
import * as brevoEmail from '../services/brevo_email.js';

await brevoEmail.sendConfirmationEmail({
  email: 'user@example.com',
  name: 'User Name',
  confirmationUrl: 'https://cantinaxl.com/confirm?token=abc123'
});
```

### Password Reset

```javascript
import * as brevoEmail from '../services/brevo_email.js';

await brevoEmail.sendPasswordResetEmail({
  email: 'user@example.com',
  name: 'User Name',
  confirmationUrl: 'https://cantinaxl.com/reset-password?token=xyz789'
});
```

### Order Confirmation

```javascript
import * as brevoEmail from '../services/brevo_email.js';

await brevoEmail.sendOrderConfirmationEmail({
  email: 'user@example.com',
  name: 'User Name',
  orderId: 'ORD-12345',
  orderDate: '13/05/2025',
  paymentMethod: 'Tarjeta de crédito',
  deliveryAddress: 'Calle Ejemplo 123, Madrid, 28001',
  packageName: 'Paquete Semanal',
  packageQuantity: 1,
  packagePrice: 59.99,
  meals: [
    { name: 'Pollo al curry', description: 'Pollo con salsa de curry y arroz basmati' },
    { name: 'Ensalada César', description: 'Lechuga romana, pollo, crutones y aderezo César' }
  ],
  discountCode: 'WELCOME10', // Optional
  discountAmount: 5.99, // Optional
  totalAmount: 54.00,
  deliveryDates: [
    { date: '15/05/2025', mealCount: 1 },
    { date: '17/05/2025', mealCount: 2 }
  ],
  orderDetailsUrl: 'https://cantinaxl.com/orders/ORD-12345'
});
```

### Delivery Reminder

```javascript
import * as brevoEmail from '../services/brevo_email.js';

await brevoEmail.sendDeliveryReminderEmail({
  email: 'user@example.com',
  name: 'User Name',
  deliveryDate: '14/05/2025',
  deliveryTimeRange: '10:00 - 14:00',
  orderId: 'ORD-12345',
  deliveryAddress: 'Calle Ejemplo 123, Madrid, 28001',
  deliveryContact: '+34 612 345 678',
  meals: [
    { name: 'Pollo al curry', description: 'Pollo con salsa de curry y arroz basmati' },
    { name: 'Ensalada César', description: 'Lechuga romana, pollo, crutones y aderezo César' }
  ],
  orderDetailsUrl: 'https://cantinaxl.com/orders/ORD-12345'
});
```

## Examples

For complete examples of how to use the email service, see the example script:

```bash
node server/examples/brevo_email_example.js
```

This script demonstrates how to send each type of email with sample data.

## Error Handling

The email service includes error handling that logs errors to the console. You can add additional error handling in your application code:

```javascript
import * as brevoEmail from '../services/brevo_email.js';

try {
  await brevoEmail.sendConfirmationEmail({
    // email options
  });
  console.log('Email sent successfully');
} catch (error) {
  console.error('Failed to send email:', error);
  // Handle the error (e.g., show a message to the user, retry, etc.)
}
```

## Customizing Templates

If you need to modify the email templates:

1. Edit the HTML files in the `/email_templates` directory
2. The changes will be automatically applied the next time an email is sent

## Brevo Dashboard

You can monitor email sending, view statistics, and manage templates in the Brevo dashboard:

[https://app.brevo.com/](https://app.brevo.com/)

## Troubleshooting

If you encounter issues with the email service:

1. Check that the Brevo API key is correct in your `.env` file
2. Verify that the template IDs in `brevo_email.js` match the ones in Brevo
3. Check the Brevo dashboard for any sending limits or issues
4. Review the console logs for error messages
