/**
 * SMART SMS SERVICE
 * Auto-detects which provider to use based on environment variables.
 * Priority: Termii → Twilio → Africa's Talking → Vonage
 *
 * Set ONE of these in Railway Variables:
 *   TERMII_API_KEY                              → uses Termii (Nigerian, recommended)
 *   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN      → uses Twilio
 *   AT_API_KEY + AT_USERNAME                    → uses Africa's Talking
 *   VONAGE_API_KEY + VONAGE_API_SECRET          → uses Vonage
 */
import axios from 'axios';

interface SmsOptions {
  to: string;   // e.g. "+2348012345678"
  message: string;
}

function getProvider(): string {
  if (process.env.TERMII_API_KEY)    return 'termii';
  if (process.env.TWILIO_ACCOUNT_SID) return 'twilio';
  if (process.env.AT_API_KEY)        return 'africastalking';
  if (process.env.VONAGE_API_KEY)    return 'vonage';
  return 'none';
}

const provider = getProvider();
console.log(`📱 SMS provider: ${provider}`);

export async function sendSms(opts: SmsOptions): Promise<void> {
  const { to, message } = opts;

  switch (provider) {
    case 'termii': {
      await axios.post('https://api.ng.termii.com/api/sms/send', {
        api_key: process.env.TERMII_API_KEY,
        to,
        from: process.env.TERMII_SENDER_ID || 'SkillTok',
        sms: message,
        type: 'plain',
        channel: 'generic'
      }, { headers: { 'Content-Type': 'application/json' } });
      break;
    }
    case 'twilio': {
      const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
      const authToken  = process.env.TWILIO_AUTH_TOKEN  || '';
      const params = new URLSearchParams({
        Body: message,
        From: process.env.TWILIO_PHONE || '',
        To: to
      });
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        params.toString(),
        {
          auth: { username: accountSid, password: authToken },
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );
      break;
    }
    case 'africastalking': {
      await axios.post('https://api.africastalking.com/version1/messaging', new URLSearchParams({
        username: process.env.AT_USERNAME || 'sandbox',
        to,
        message,
        from: process.env.AT_SENDER_ID || ''
      }).toString(), {
        headers: {
          apiKey: process.env.AT_API_KEY || '',
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        }
      });
      break;
    }
    case 'vonage': {
      await axios.post('https://rest.nexmo.com/sms/json', {
        api_key:    process.env.VONAGE_API_KEY,
        api_secret: process.env.VONAGE_API_SECRET,
        from:       process.env.VONAGE_FROM || 'SkillTok',
        to:         to.replace('+', ''),
        text:       message
      });
      break;
    }
    default: {
      console.warn(`⚠️  No SMS provider configured. Would send to: ${to} | Message: ${message}`);
    }
  }
}
