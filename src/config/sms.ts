/**
 * SMS message templates for Niouspark
 * All templates are optimized for Ghana mobile users
 */

export const SMS_TEMPLATES = {
  /**
   * Welcome message for new account signup
   */
  SIGNUP: "Welcome to Niouspark Hub! Your account is ready. Join our WhatsApp group: https://chat.whatsapp.com/DRinAaouI5y9K0DvYyu1E1",
  
  /**
   * Bundle purchase confirmation
   * Use {{bundle}} placeholder for bundle details
   */
  BUNDLE_PURCHASED: "{{bundle}} purchased for this number. Processing… expect it in 5-20 min. Need help? https://chat.whatsapp.com/DRinAaouI5y9K0DvYyu1E1",
  
  /**
   * Admin purchase notification
   * Use {{bundle}} and {{admin}} placeholders
   */
  ADMIN_PURCHASE: "{{bundle}} delivered via admin purchase by {{admin}}. Enjoy your data!",
  
  /**
   * Payment failure notification
   * Use {{reason}} placeholder for failure reason
   */
  PAYMENT_FAILED: "Payment failed: {{reason}}. Please try again or contact support: https://bit.ly/NiousparkHelp",
  
  /**
   * Bundle delivery confirmation
   * Use {{bundle}} placeholder for bundle details
   */
  BUNDLE_DELIVERED: "{{bundle}} successfully delivered to your number. Enjoy your data! Powered by Niouspark."
} as const;

/**
 * Replace placeholders in SMS templates
 * @param template - Template string with {{placeholder}} markers
 * @param replacements - Object with placeholder values
 * @returns Processed message
 */
export function processSmsTemplate(template: string, replacements: Record<string, string>): string {
  let message = template;
  
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return message;
}
