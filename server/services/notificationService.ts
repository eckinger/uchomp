import { pool } from "../db/db";
import { Resend } from 'resend';

const resend = new Resend('re_EAiWesYB_BUVrtCALbKrrpzZZkdp2wwNn');

export async function sendEmail(email: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: 'hello@uchomp.dev',
      to: email,
      subject,
      html
    });
    return { success: true };
  } catch(err) {
    console.error("Error sending email:", err);
    return { success: false, error: (err as Error).message };
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

  return sendEmail(userEmail, subject, html);
}