/**
 * SkillTok Service Adapter
 * Auto-detects which third-party service to use based on available env variables.
 * Just set the right keys in Railway — no code changes needed.
 */

import nodemailer from 'nodemailer';
import axios from 'axios';

// ════════════════════════════════════════════════════════════════
// EMAIL — detects: Resend > SendGrid > Mailgun > Brevo > Gmail
// ════════════════════════════════════════════════════════════════
export async function sendEmail(to: string, subject: string, html: string) {
  // 1. Resend
  if (process.env.RESEND_API_KEY) {
    await axios.post('https://api.resend.com/emails', {
      from: process.env.EMAIL_FROM || 'SkillTok <noreply@skilltok.com>',
      to, subject, html
    }, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }
    });
    return;
  }

  // 2. SendGrid
  if (process.env.SENDGRID_API_KEY) {
    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.EMAIL_FROM || 'noreply@skilltok.com', name: 'SkillTok' },
      subject,
      content: [{ type: 'text/html', value: html }]
    }, {
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' }
    });
    return;
  }

  // 3. Mailgun
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('from', process.env.EMAIL_FROM || `SkillTok <noreply@${process.env.MAILGUN_DOMAIN}>`);
    form.append('to', to);
    form.append('subject', subject);
    form.append('html', html);
    await axios.post(
      `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`,
      form,
      { auth: { username: 'api', password: process.env.MAILGUN_API_KEY }, headers: form.getHeaders() }
    );
    return;
  }

  // 4. Brevo (formerly Sendinblue)
  if (process.env.BREVO_API_KEY) {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'SkillTok', email: process.env.EMAIL_FROM || 'noreply@skilltok.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    }, {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
    return;
  }

  // 5. Gmail / any SMTP (fallback)
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user: process.env.EMAIL_USER || '', pass: process.env.EMAIL_PASSWORD || '' }
  });
  await transporter.sendMail({
    from: `"SkillTok" <${process.env.EMAIL_USER}>`,
    to, subject, html
  });
}

// ════════════════════════════════════════════════════════════════
// SMS / OTP — detects: Termii > Africa's Talking > Vonage > Twilio
// ════════════════════════════════════════════════════════════════
export async function sendSMS(phone: string, message: string) {
  // 1. Laaffic (first priority)
  if (process.env.LAAFFIC_API_KEY && process.env.LAAFFIC_API_SECRET && process.env.LAAFFIC_APP_ID) {
    const crypto = require('crypto');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    // Laaffic signature: MD5(apiKey + apiSecret + timestamp)
    const sign = crypto.createHash('md5')
      .update(process.env.LAAFFIC_API_KEY + process.env.LAAFFIC_API_SECRET + timestamp)
      .digest('hex');

    await axios.post('https://api.laaffic.com/v3/sendSms', {
      appId:    process.env.LAAFFIC_APP_ID,
      numbers:  phone,
      content:  message,
      senderId: process.env.LAAFFIC_SENDER_ID || 'SkillTok',
    }, {
      auth: {
        username: process.env.LAAFFIC_API_KEY,
        password: process.env.LAAFFIC_API_SECRET
      },
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Sign':      sign,
        'Timestamp': timestamp,
        'Api-Key':   process.env.LAAFFIC_API_KEY,
      }
    });
    return;
  }

  // 2. Termii
  if (process.env.TERMII_API_KEY) {
    await axios.post('https://api.ng.termii.com/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,
      to: phone,
      from: process.env.TERMII_SENDER_ID || 'SkillTok',
      sms: message,
      type: 'plain',
      channel: 'generic'
    }, { headers: { 'Content-Type': 'application/json' } });
    return;
  }

  // 2. Africa's Talking
  if (process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME) {
    const qs = require('querystring');
    await axios.post('https://api.africastalking.com/version1/messaging', qs.stringify({
      username: process.env.AFRICASTALKING_USERNAME,
      to: phone,
      message,
      from: process.env.AFRICASTALKING_SENDER_ID || ''
    }), {
      headers: {
        apiKey: process.env.AFRICASTALKING_API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return;
  }

  // 3. Vonage (formerly Nexmo)
  if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET) {
    await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: process.env.VONAGE_API_KEY,
      api_secret: process.env.VONAGE_API_SECRET,
      to: phone,
      from: process.env.VONAGE_FROM || 'SkillTok',
      text: message
    });
    return;
  }

  // 4. Twilio (fallback)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
    return;
  }

  console.warn('No SMS provider configured. Set TERMII_API_KEY, AFRICASTALKING_API_KEY, VONAGE_API_KEY, or TWILIO_ACCOUNT_SID');
}

// ════════════════════════════════════════════════════════════════
// FILE STORAGE — detects: Cloudinary > AWS S3 > Uploadcare > Backblaze
// ════════════════════════════════════════════════════════════════
export async function uploadFile(buffer: Buffer, filename: string, mimetype: string, folder = 'skilltok'): Promise<string> {
  // 1. Cloudinary
  if (process.env.CLOUDINARY_API_KEY) {
    const { v2: cloudinary } = require('cloudinary');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const result: any = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder },
        (err: any, res: any) => err ? reject(err) : resolve(res)
      ).end(buffer);
    });
    return result.secure_url;
  }

  // 2. AWS S3
  if (process.env.AWS_ACCESS_KEY_ID && process.env.S3_BUCKET) {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    const key = `${folder}/${Date.now()}-${filename}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read'
    }));
    return `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  // 3. Uploadcare
  if (process.env.UPLOADCARE_PUBLIC_KEY) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('UPLOADCARE_PUB_KEY', process.env.UPLOADCARE_PUBLIC_KEY);
    form.append('UPLOADCARE_STORE', '1');
    form.append('file', buffer, { filename, contentType: mimetype });
    const res = await axios.post('https://upload.uploadcare.com/base/', form, { headers: form.getHeaders() });
    return `https://ucarecdn.com/${res.data.file}/`;
  }

  // 4. Backblaze B2
  if (process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY && process.env.B2_BUCKET_ID) {
    // Authorize
    const authRes = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      auth: { username: process.env.B2_KEY_ID, password: process.env.B2_APPLICATION_KEY }
    });
    const { apiUrl, authorizationToken, downloadUrl } = authRes.data;
    // Get upload URL
    const urlRes = await axios.post(`${apiUrl}/b2api/v2/b2_get_upload_url`,
      { bucketId: process.env.B2_BUCKET_ID },
      { headers: { Authorization: authorizationToken } }
    );
    const { uploadUrl, authorizationToken: uploadToken } = urlRes.data;
    const key = `${folder}/${Date.now()}-${filename}`;
    const sha1 = require('crypto').createHash('sha1').update(buffer).digest('hex');
    await axios.post(uploadUrl, buffer, {
      headers: {
        Authorization: uploadToken,
        'X-Bz-File-Name': key,
        'Content-Type': mimetype,
        'X-Bz-Content-Sha1': sha1
      }
    });
    return `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${key}`;
  }

  throw new Error('No file storage provider configured. Set CLOUDINARY_API_KEY, AWS_ACCESS_KEY_ID, UPLOADCARE_PUBLIC_KEY, or B2_KEY_ID');
}

// ════════════════════════════════════════════════════════════════
// PAYMENTS — detects: Paystack > Flutterwave > Stripe > Monnify
// ════════════════════════════════════════════════════════════════
export function getPaymentProvider(): 'paystack' | 'flutterwave' | 'stripe' | 'monnify' | null {
  if (process.env.PAYSTACK_SECRET_KEY)    return 'paystack';
  if (process.env.FLUTTERWAVE_SECRET_KEY) return 'flutterwave';
  if (process.env.STRIPE_SECRET_KEY)      return 'stripe';
  if (process.env.MONNIFY_API_KEY)        return 'monnify';
  return null;
}

export async function initializePayment(params: {
  email: string;
  amountCents: number;
  currency?: string;
  reference: string;
  callbackUrl: string;
  metadata?: any;
}): Promise<{ paymentUrl: string; reference: string }> {
  const { email, amountCents, currency = 'NGN', reference, callbackUrl, metadata } = params;
  const provider = getPaymentProvider();

  if (provider === 'paystack') {
    const res = await axios.post('https://api.paystack.co/transaction/initialize', {
      email, amount: amountCents, currency, reference,
      callback_url: callbackUrl, metadata
    }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
    return { paymentUrl: res.data.data.authorization_url, reference: res.data.data.reference };
  }

  if (provider === 'flutterwave') {
    const res = await axios.post('https://api.flutterwave.com/v3/payments', {
      tx_ref: reference, amount: amountCents / 100, currency,
      redirect_url: callbackUrl, customer: { email }, meta: metadata
    }, { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } });
    return { paymentUrl: res.data.data.link, reference };
  }

  if (provider === 'stripe') {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price_data: { currency: currency.toLowerCase(), product_data: { name: 'SkillTok Service' }, unit_amount: amountCents }, quantity: 1 }],
      mode: 'payment',
      success_url: callbackUrl + '?status=success&ref=' + reference,
      cancel_url: callbackUrl + '?status=cancelled',
      metadata
    });
    return { paymentUrl: session.url, reference };
  }

  if (provider === 'monnify') {
    const authRes = await axios.post('https://api.monnify.com/api/v1/auth/login', {}, {
      auth: { username: process.env.MONNIFY_API_KEY || '', password: process.env.MONNIFY_SECRET_KEY || '' }
    });
    const token = authRes.data.responseBody.accessToken;
    const res = await axios.post('https://api.monnify.com/api/v1/merchant/transactions/init-transaction', {
      amount: amountCents / 100, customerName: email, customerEmail: email,
      paymentReference: reference, paymentDescription: 'SkillTok Payment',
      currencyCode: currency, contractCode: process.env.MONNIFY_CONTRACT_CODE,
      redirectUrl: callbackUrl
    }, { headers: { Authorization: `Bearer ${token}` } });
    return { paymentUrl: res.data.responseBody.checkoutUrl, reference };
  }

  throw new Error('No payment provider configured. Set PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, STRIPE_SECRET_KEY, or MONNIFY_API_KEY');
}

export async function verifyPayment(reference: string): Promise<boolean> {
  const provider = getPaymentProvider();

  if (provider === 'paystack') {
    const res = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
    return res.data.data.status === 'success';
  }

  if (provider === 'flutterwave') {
    const res = await axios.get(`https://api.flutterwave.com/v3/transactions/${reference}/verify`,
      { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } });
    return res.data.data.status === 'successful';
  }

  if (provider === 'stripe') {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(reference);
    return session.payment_status === 'paid';
  }

  return false;
}

// ════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS — detects: FCM > OneSignal > Web Push (VAPID)
// ════════════════════════════════════════════════════════════════
export async function sendPushNotification(userId: string, title: string, body: string, url = '/') {
  // 1. Firebase FCM
  if (process.env.FIREBASE_SERVER_KEY) {
    // Get user FCM tokens from DB (stored during registration)
    await axios.post('https://fcm.googleapis.com/fcm/send', {
      to: `/topics/user_${userId}`,
      notification: { title, body },
      data: { url }
    }, { headers: { Authorization: `key=${process.env.FIREBASE_SERVER_KEY}`, 'Content-Type': 'application/json' } });
    return;
  }

  // 2. OneSignal
  if (process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_API_KEY) {
    await axios.post('https://onesignal.com/api/v1/notifications', {
      app_id: process.env.ONESIGNAL_APP_ID,
      filters: [{ field: 'tag', key: 'userId', relation: '=', value: userId }],
      headings: { en: title },
      contents: { en: body },
      url
    }, { headers: { Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`, 'Content-Type': 'application/json' } });
    return;
  }

  // 3. Web Push VAPID (fallback — uses DB stored subscriptions)
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const webpush = require('web-push');
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@skilltok.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    // DB lookup happens in the caller (notifications route)
    return;
  }

  console.warn('No push provider configured. Set FIREBASE_SERVER_KEY, ONESIGNAL_APP_ID, or VAPID keys.');
}

// ════════════════════════════════════════════════════════════════
// STATUS — shows which providers are active (for admin panel)
// ════════════════════════════════════════════════════════════════
export function getActiveProviders() {
  return {
    email:
      process.env.RESEND_API_KEY        ? 'Resend'         :
      process.env.SENDGRID_API_KEY      ? 'SendGrid'       :
      process.env.MAILGUN_API_KEY       ? 'Mailgun'        :
      process.env.BREVO_API_KEY         ? 'Brevo'          :
      process.env.EMAIL_USER            ? 'Gmail/SMTP'     : 'Not configured',

    sms:
      process.env.LAAFFIC_API_KEY            ? 'Laaffic'           :
      process.env.TERMII_API_KEY             ? 'Termii'            :
      process.env.AFRICASTALKING_API_KEY     ? "Africa's Talking"  :
      process.env.VONAGE_API_KEY             ? 'Vonage'            :
      process.env.TWILIO_ACCOUNT_SID         ? 'Twilio'            : 'Not configured',

    storage:
      process.env.CLOUDINARY_API_KEY    ? 'Cloudinary'     :
      process.env.AWS_ACCESS_KEY_ID     ? 'AWS S3'         :
      process.env.UPLOADCARE_PUBLIC_KEY ? 'Uploadcare'     :
      process.env.B2_KEY_ID             ? 'Backblaze B2'   : 'Not configured',

    payments:
      process.env.PAYSTACK_SECRET_KEY    ? 'Paystack'      :
      process.env.FLUTTERWAVE_SECRET_KEY ? 'Flutterwave'   :
      process.env.STRIPE_SECRET_KEY      ? 'Stripe'        :
      process.env.MONNIFY_API_KEY        ? 'Monnify'       : 'Not configured',

    push:
      process.env.FIREBASE_SERVER_KEY   ? 'Firebase FCM'  :
      process.env.ONESIGNAL_APP_ID      ? 'OneSignal'     :
      process.env.VAPID_PUBLIC_KEY      ? 'Web Push'      : 'Not configured',
  };
}
