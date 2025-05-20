import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(email: string, subject: string, html: string) {
  try {
    console.log("type:", JSON.stringify(resend))
    const response = await resend.emails.send({
      from: 'UChomps <uchomp@aeckinger.com>',
      to: [email],
      subject,
      html,
    });

    if (!response) {
      return { 
        success: false, 
        error: "Failed to send email" 
      };
    }
    return { 
      success: true,
      data: response 
    };

  } catch (err) {
    console.log("3")
    console.error("Error sending email:", err);
    return { 
      success: false, 
      error: (err instanceof Error) ? err.message : "Unknown error occurred"
    };
  }
}

export async function sendExpirationNotification(
  userEmail: string, 
  groupName: string,
  expirationTime: Date
) {
  const timeFormatted = expirationTime.toLocaleTimeString();
  const subject = `Your UChomps group for ${groupName} is expiring soon`;
  const html = `
    <h2>Group Order Expiring Soon</h2>
    <p>Your food order group for ${groupName} will expire at ${timeFormatted}.</p>
    <p>Please make sure to finalize your order before the expiration time.</p>
  `;
  console.log("Hello?")
  return sendEmail(userEmail, subject, html);
}

export async function sendJoinNotification(
  userEmail: string,
  groupName: string
) {
  const subject = `Welcome to ${groupName} group on UChomps`;
  const html = `
    <h2>Successfully Joined Group</h2>
    <p>You have successfully joined the food order group for ${groupName}.</p>
    <p>You'll receive notifications about group updates and when the order is about to expire.</p>
  `;
  console.log("Oh Hi!")
  return sendEmail(userEmail, subject, html);
}

export async function sendLeaveNotification(
  userEmail: string,
  groupName: string
) {
  const subject = `Left ${groupName} group on UChomps`;
  const html = `
    <h2>Group Left</h2>
    <p>You have left the food order group for ${groupName}.</p>
    <p>Feel free to join other groups or create your own!</p>
  `;
  console.log("Goodbye.")
  return sendEmail(userEmail, subject, html);
}