#!/bin/bash

# Default values
WEBHOOK_URL="http://localhost:3000/api/payments/webhook"
ORDER_ID=""
AMOUNT=10000 

# Ask for order ID
read -p "Enter the order ID (or press Enter to use a random UUID): " ORDER_ID
if [ -z "$ORDER_ID" ]; then
  # Generate a random UUID if none provided
  ORDER_ID=$(uuidgen || cat /proc/sys/kernel/random/uuid 2>/dev/null || python -c "import uuid; print(uuid.uuid4())")
  echo "Using generated order ID: $ORDER_ID"
fi

# Ask for amount
read -p "Enter the payment amount in cents (or press Enter for default 10000 cents = 100€): " AMOUNT_INPUT
if [ -n "$AMOUNT_INPUT" ]; then
  AMOUNT=$AMOUNT_INPUT
fi

# Generate a mock bank order code
BANK_ORDER_CODE="MOCK-$(date +%s)"

# Create the webhook payload
PAYLOAD=$(cat <<EOF
{
  "status": "success",
  "data": {
    "state": 5,
    "reference": "$ORDER_ID",
    "originalCurrencyAmount": $AMOUNT,
    "bankOrderCode": "$BANK_ORDER_CODE",
    "signaturev2": "mock-signature",
    "currency": "EUR",
    "amount": $AMOUNT,
    "concept": "Test payment for order $ORDER_ID",
    "description": "Mock webhook for testing",
    "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  }
}
EOF
)

echo -e "\nSending webhook payload:"
echo "$PAYLOAD" | jq . 2>/dev/null || echo "$PAYLOAD"

echo -e "\nSending request to $WEBHOOK_URL..."

# Send the webhook request
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo -e "\nWebhook response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo -e "\nSuccess! The payment has been marked as completed."
echo "You can now check the payment status for order: $ORDER_ID"
