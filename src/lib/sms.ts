import axios from 'axios';

const FROG_SMS_API_URL = process.env.FROG_SMS_API_URL || 'https://frogapi.wigal.com.gh/api/v3';
const FROG_SMS_API_KEY = process.env.FROG_SMS_API_KEY || '';
const FROG_SMS_USERNAME = process.env.FROG_SMS_USERNAME || '';
const FROG_SMS_SENDER_ID = process.env.FROG_SMS_SENDER_ID || 'Niouspark';

interface FrogSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS via Frog SMS API (Ghana)
 * @param to - Phone number in format 233XXXXXXXXX or 0XXXXXXXXX
 * @param text - Message content
 * @param msgId - Optional message ID for tracking
 * @returns Promise with success status and message ID
 */
export async function sendSms(to: string, text: string, msgId?: string): Promise<FrogSMSResponse> {
  try {
    // Validate API configuration
    if (!FROG_SMS_API_KEY || !FROG_SMS_USERNAME) {
      throw new Error('Frog SMS API credentials not configured');
    }

    // Normalize phone number format
    const normalizedPhone = normalizePhoneNumber(to);
    
    // Generate message ID if not provided
    const messageId = msgId || `niouspark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payload = {
      senderid: FROG_SMS_SENDER_ID,
      destinations: [
        {
          destination: normalizedPhone,
          msgid: messageId
        }
      ],
      message: text,
      smstype: 'text'
    };

    console.log(`📱 Sending SMS to ${normalizedPhone}:`, { messageId, text: text.substring(0, 50) + '...' });
    console.log('🔍 SMS Debug - Full payload:', JSON.stringify(payload, null, 2));
    console.log('🔍 SMS Debug - API URL:', FROG_SMS_API_URL);
    console.log('🔍 SMS Debug - Headers:', {
      'API-KEY': FROG_SMS_API_KEY ? '***' + FROG_SMS_API_KEY.slice(-4) : 'MISSING',
      'USERNAME': FROG_SMS_USERNAME || 'MISSING',
      'Content-Type': 'application/json'
    });

    const response = await axios.post(`${FROG_SMS_API_URL}/sms/send`, payload, {
      headers: {
        'API-KEY': FROG_SMS_API_KEY,
        'USERNAME': FROG_SMS_USERNAME,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.success !== false) {
      console.log(`✅ SMS sent successfully to ${normalizedPhone}, Message ID: ${messageId}`);
      return {
        success: true,
        messageId: messageId
      };
    } else {
      throw new Error(response.data?.message || 'SMS sending failed');
    }

  } catch (error: any) {
    console.error(`❌ SMS sending failed to ${to}:`, error.message);
    
    // Log detailed error information
    if (error.response) {
      console.error('🔍 SMS Error - Response status:', error.response.status);
      console.error('🔍 SMS Error - Response data:', error.response.data);
      console.error('🔍 SMS Error - Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('🔍 SMS Error - No response received:', error.request);
    } else {
      console.error('🔍 SMS Error - Request setup error:', error.message);
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Normalize phone number to Frog SMS format (233XXXXXXXXX)
 * @param phone - Phone number in various formats
 * @returns Normalized phone number
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  // Handle 2330XXXXXXXXX (often happens when user prefixes with +233 and keeps the leading 0)
  if (digits.startsWith('2330') && digits.length === 13) {
    digits = '233' + digits.substring(4);
  }
  
  // Handle different formats
  if (digits.startsWith('233') && digits.length === 12) {
    return digits; // Correct format (233 + 9 digits)
  } else if (digits.startsWith('0') && digits.length === 10) {
    return '233' + digits.substring(1); // Convert 0XXXXXXXXX to 233XXXXXXXXX
  } else if (digits.length === 9) {
    return '233' + digits; // Add 233 prefix
  } else {
    throw new Error(`Invalid phone number format: ${phone}. Expected format: 233XXXXXXXXX or 0XXXXXXXXX`);
  }
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if valid Ghana phone number format
 */
export function isValidGhanaPhoneNumber(phone: string): boolean {
  try {
    const normalized = normalizePhoneNumber(phone);
    return /^233[0-9]{9}$/.test(normalized);
  } catch {
    return false;
  }
}
