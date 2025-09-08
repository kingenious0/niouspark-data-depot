import { NextRequest, NextResponse } from "next/server";
import { sendSms } from '@/lib/sms';
import { SMS_TEMPLATES } from '@/config/sms';

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, userName } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Phone number is required' 
      }, { status: 400 });
    }

    console.log('🔍 Server-side SMS - Sending welcome SMS to:', phoneNumber);
    console.log('🔍 Server-side SMS - API Key exists:', !!process.env.FROG_SMS_API_KEY);
    console.log('🔍 Server-side SMS - Username exists:', !!process.env.FROG_SMS_USERNAME);

    const result = await sendSms(phoneNumber, SMS_TEMPLATES.SIGNUP);

    if (result.success) {
      console.log(`✅ Welcome SMS sent to ${phoneNumber}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Welcome SMS sent successfully',
        messageId: result.messageId 
      });
    } else {
      console.error('❌ SMS failed:', result.error);
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Server-side SMS error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
