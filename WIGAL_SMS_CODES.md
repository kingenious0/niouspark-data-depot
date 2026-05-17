# 📱 Wigal (Frog API) SMS Integration Guide

This comprehensive guide contains all the code, environment variables, utility functions, and API routes needed to integrate the **Wigal (Frog API) SMS Service** into your other project. 

As requested, this setup is designed to easily allow a **different Sender ID** and is highly modular for seamless plug-and-play.

---

## 🔑 1. Environment Setup

Add these environment variables to your project's `.env` or `.env.local` file. 

> [!NOTE]
> Update `FROG_SMS_SENDER_ID` with the custom Sender ID for your new project. Ensure that this Sender ID has been officially approved and registered in your Wigal dashboard.

```env
# Wigal Frog SMS Configuration
FROG_SMS_API_URL=https://frogapi.wigal.com.gh/api/v3
FROG_SMS_API_KEY=your_wigal_api_key_here
FROG_SMS_USERNAME=your_wigal_username_here
FROG_SMS_SENDER_ID=YourCustomSenderID
```

---

## 📦 2. Required Dependency

This integration uses `axios` for HTTP requests. If you haven't installed it, run:

```bash
npm install axios
# or
yarn add axios
# or
pnpm add axios
```

---

## 🛠️ 3. Core SMS Utility Service

Create a file named `sms.ts` (e.g., in `src/lib/sms.ts` or `utils/sms.ts`). 

This handles phone number validation, formatting (Ghana-specific format `233XXXXXXXXX`), and payload building.

```typescript
import axios from 'axios';

// Load credentials from environment variables
const FROG_SMS_API_URL = process.env.FROG_SMS_API_URL || 'https://frogapi.wigal.com.gh/api/v3';
const FROG_SMS_API_KEY = process.env.FROG_SMS_API_KEY || '';
const FROG_SMS_USERNAME = process.env.FROG_SMS_USERNAME || '';
// This will default to your configured sender ID or fallback to a default
const FROG_SMS_SENDER_ID = process.env.FROG_SMS_SENDER_ID || 'YourDefaultSenderID';

interface FrogSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Wigal Frog SMS API
 * @param to - Phone number in format 233XXXXXXXXX or 0XXXXXXXXX
 * @param text - Message content
 * @param msgId - Optional custom message ID for delivery status tracking
 * @returns Promise with success status and message ID
 */
export async function sendSms(to: string, text: string, msgId?: string): Promise<FrogSMSResponse> {
  try {
    // Validate credentials
    if (!FROG_SMS_API_KEY || !FROG_SMS_USERNAME) {
      throw new Error('Frog SMS API credentials not configured in environment variables');
    }

    // Normalize phone number to Wigal format (e.g., 233240000000)
    const normalizedPhone = normalizePhoneNumber(to);
    
    // Generate unique message ID if not provided
    const messageId = msgId || `sms_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Prepare Wigal payload
    const payload = {
      senderid: FROG_SMS_SENDER_ID, // Uses custom sender ID
      destinations: [
        {
          destination: normalizedPhone,
          msgid: messageId
        }
      ],
      message: text,
      smstype: 'text'
    };

    console.log(`📱 Sending SMS to ${normalizedPhone} using Sender ID [${FROG_SMS_SENDER_ID}]:`, { 
      messageId, 
      text: text.substring(0, 50) + '...' 
    });

    const response = await axios.post(`${FROG_SMS_API_URL}/sms/send`, payload, {
      headers: {
        'API-KEY': FROG_SMS_API_KEY,
        'USERNAME': FROG_SMS_USERNAME,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second request timeout
    });

    // Wigal returns success or error status inside response.data
    if (response.data && response.data.success !== false) {
      console.log(`✅ SMS sent successfully to ${normalizedPhone}, Message ID: ${messageId}`);
      return {
        success: true,
        messageId: messageId
      };
    } else {
      throw new Error(response.data?.message || 'Wigal API returned failure response');
    }

  } catch (error: any) {
    console.error(`❌ SMS sending failed to ${to}:`, error.message);
    
    // Detailed error diagnostics
    if (error.response) {
      console.error('🔍 Wigal Error Response Status:', error.response.status);
      console.error('🔍 Wigal Error Response Data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Normalizes phone number to Wigal required format (233XXXXXXXXX)
 * @param phone - Raw phone number input
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('233')) {
    return digits; // Correct format
  } else if (digits.startsWith('0') && digits.length === 10) {
    return '233' + digits.substring(1); // 0XXXXXXXXX -> 233XXXXXXXXX
  } else if (digits.length === 9) {
    return '233' + digits; // XXXXXXXXX -> 233XXXXXXXXX
  } else {
    throw new Error(`Invalid Ghana phone number format: ${phone}`);
  }
}

/**
 * Utility to validate Ghana phone numbers
 * @param phone - Phone number to test
 */
export function isValidGhanaPhoneNumber(phone: string): boolean {
  try {
    const normalized = normalizePhoneNumber(phone);
    return /^233[0-9]{9}$/.test(normalized);
  } catch {
    return false;
  }
}
```

---

## 💬 4. SMS Templates & Replacements

Create a configuration file `smsTemplates.ts` (e.g., in `src/config/smsTemplates.ts`) to manage all SMS copies in one clean location.

```typescript
/**
 * Customizable SMS Message Templates
 */
export const SMS_TEMPLATES = {
  /**
   * Welcome sign up message
   */
  WELCOME: "Welcome to our platform! Your account is active. Join our group: https://chat.whatsapp.com/DRinAaouI5y9K0DvYyu1E1",
  
  /**
   * Order confirmation
   * Placeholder: {{orderId}} and {{amount}}
   */
  ORDER_CONFIRMED: "Thank you! Order {{orderId}} of {{amount}} GHS has been received and is being processed.",
  
  /**
   * Delivery success
   * Placeholder: {{itemName}}
   */
  DELIVERY_SUCCESS: "Your order [{{itemName}}] has been successfully delivered. Thank you for choosing us!",
  
  /**
   * General Alert
   */
  ALERT: "ALERT: {{message}}"
} as const;

/**
 * Helper to dynamically replace placeholders in templates
 * @param template - Template string (e.g., "Hello {{name}}")
 * @param replacements - Key-value pair object (e.g., { name: "Akwasi" })
 */
export function processTemplate(template: string, replacements: Record<string, string>): string {
  let message = template;
  
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return message;
}
```

---

## ⚡ 5. Next.js API Routes (App Router)

Below are ready-to-use Next.js API routes that you can copy directly into your new project.

### 📤 A. Send Message Endpoint (`/api/send-sms/route.ts`)
This API endpoint receives a phone number and message body and invokes the utility service.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { sendSms } from '@/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number and message content are required' 
      }, { status: 400 });
    }

    const result = await sendSms(phoneNumber, message);

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'SMS sent successfully',
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

### 📡 B. Delivery Callback Endpoint (`/api/sms/callback/route.ts`)
Configure this URL `https://yourdomain.com/api/sms/callback` in your Wigal/Frog SMS Dashboard. Wigal will hit this endpoint to report delivery status.

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Wigal callback parameters:
    // - msgid: The unique message ID sent in payload destinations
    // - status: E.g., 'delivered', 'undelivered', 'expired'
    // - destination: Receiver phone number
    // - statusdate: Timestamp of status update
    const { msgid, status, destination, statusdate } = body;

    console.log('📡 SMS Status Callback Received:', { msgid, status, destination, statusdate });

    // TODO: Write code here to update your DB status, for example:
    // await db.collection('sms_logs').doc(msgid).update({ status, statusDate: statusdate });

    return NextResponse.json({ success: true, message: 'Callback processed successfully' });
  } catch (error: any) {
    console.error('❌ Callback processing error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Callback processing failed' 
    }, { status: 500 });
  }
}
```

---

## 🧪 6. Raw cURL Test command

Use this simple cURL to test your credentials and custom Sender ID directly from the terminal.

```bash
curl -X POST "https://frogapi.wigal.com.gh/api/v3/sms/send" \
  -H "API-KEY: YOUR_API_KEY" \
  -H "USERNAME: YOUR_USERNAME" \
  -H "Content-Type: application/json" \
  -d '{
    "senderid": "YourCustomSenderID",
    "destinations": [{"destination": "233240000000", "msgid": "test_id_101"}],
    "message": "Hello from my new project! This is a test SMS.",
    "smstype": "text"
  }'
```

---

> [!TIP]
> Keep in mind that Wigal requires phone numbers to be in international format **without** the leading `+` (e.g. `23324XXXXXXX` for Ghana). The normalization helper included in the `sms.ts` file automatically strips `+` and formats local numbers correctly!
