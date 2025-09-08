import { NextRequest, NextResponse } from "next/server";
import { sendSms } from '@/lib/sms';

/**
 * Debug endpoint to test SMS service
 * Only available in development
 */
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      success: false, 
      error: 'Debug endpoint only available in development' 
    }, { status: 403 });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    console.log('🔍 Debug SMS - Testing with phone:', phoneNumber);
    console.log('🔍 Debug SMS - API Key exists:', !!process.env.FROG_SMS_API_KEY);
    console.log('🔍 Debug SMS - Username exists:', !!process.env.FROG_SMS_USERNAME);
    console.log('🔍 Debug SMS - Sender ID:', process.env.FROG_SMS_SENDER_ID);

    const result = await sendSms(phoneNumber, 'Test SMS from Niouspark Debug');

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      debug: {
        phoneNumber,
        apiKeyExists: !!process.env.FROG_SMS_API_KEY,
        usernameExists: !!process.env.FROG_SMS_USERNAME,
        senderId: process.env.FROG_SMS_SENDER_ID
      }
    });

  } catch (error: any) {
    console.error('Debug SMS error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
