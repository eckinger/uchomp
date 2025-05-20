import { Resend } from 'resend';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.RESEND_API_KEY;
if (!API_KEY) {
  console.error('❌ RESEND_API_KEY is not defined in your environment variables');
  process.exit(1);
}

// Log the first few characters of the API key to verify it's loaded
// (but not the whole key for security)
console.log(`Using API key: ${API_KEY.substring(0, 4)}...`);

const resend = new Resend(API_KEY);

async function testSendEmail() {
  try {
    console.log('Attempting to send test email...');
    
    const response = await resend.emails.send({
      from: 'UChomps <uchomp@aeckinger.com>',
      to: ['fine1@uchicago.edu'], // Replace with your actual email
      subject: 'Test Email from Resend',
      html: '<h1>This is a test email</h1><p>If you received this, Resend is working correctly!</p>',
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error);
    return error;
  }
}

// Execute the test
testSendEmail();

