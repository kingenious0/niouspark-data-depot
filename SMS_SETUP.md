# Frog SMS Integration Setup

## Environment Variables

Add these variables to your `.env.local` file:

```env
# Frog SMS Configuration
FROG_SMS_API_URL=https://frogapi.wigal.com.gh/api/v3
FROG_SMS_API_KEY=your_frog_sms_api_key_here
FROG_SMS_USERNAME=your_frog_sms_username_here
FROG_SMS_SENDER_ID=Niouspark
```

## SMS Test Command

Test the SMS integration with this curl command:

```bash
curl -X POST "https://frogapi.wigal.com.gh/api/v3/sms/send" \
  -H "API-KEY: YOUR_API_KEY" \
  -H "USERNAME: YOUR_USERNAME" \
  -H "Content-Type: application/json" \
  -d '{
    "senderid": "Niouspark",
    "destinations": [{"destination": "233XXXXXXXXX", "msgid": "test_123"}],
    "message": "Welcome to Niouspark Hub! Your account is ready. Join our WhatsApp group: https://bit.ly/NiousparkWP",
    "smstype": "text"
  }'
```

## Features Implemented

✅ **Account Signup SMS** - Welcome message sent after successful account creation
✅ **Bundle Purchase SMS** - Confirmation and delivery notifications
✅ **Admin Purchase SMS** - Special notifications for admin purchases
✅ **Payment Failure SMS** - Error notifications with retry instructions
✅ **Phone Number Validation** - Ghana phone number format validation
✅ **SMS Callback Tracking** - Delivery status tracking endpoint

## SMS Templates

- **SIGNUP**: Welcome message with WhatsApp group link
- **BUNDLE_PURCHASED**: Purchase confirmation with processing time
- **ADMIN_PURCHASE**: Special admin purchase notification
- **PAYMENT_FAILED**: Payment failure with support link
- **BUNDLE_DELIVERED**: Delivery confirmation message

## Callback URL

Configure this URL in your Frog SMS dashboard for delivery status tracking:
`https://yourdomain.com/api/sms/callback`
