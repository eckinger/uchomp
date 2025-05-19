import { pool } from "../db/db";
import * as notificationService from "./notificationService";

// code generator
function generateCode(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

// Insert or update a code for an email
export async function sendCode(
  email: string
): Promise<{ success: boolean; code?: number; error?: string }> {
  const code = generateCode();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email");
  }

  try {
    // Create the user if they didn't exist before
    await pool.query("CALL ensure_user_exists($1)", [email]);

    // Now insert or update the code
    await pool.query("CALL create_verification_code($1, $2)", [email, code]);

    const subject = `Your UChomps Verification Code: ${code}`;
    const html = `
      <h2>Welcome to UChomps!</h2>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>Please enter this code to verify your email address.</p>
    `;
    
    await notificationService.sendEmail(email, subject, html);
    return { success: true, code };
  } catch (err) {
    console.error("Error inserting code:", err);
    return {
      success: false,
      error: `Database error: ${(err as Error).message}`,
    };
  }
}

export async function verify(
  email: string,
  code: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(`SELECT * FROM verify_user_code($1, $2)`, [
      email,
      code,
    ]);

    const row = result.rows[0];
    if (!row.success) {
      return { success: false, error: row.error };
    }

    console.log(`Generated code for ${email}: ${code}`);
    return { success: true };
  } catch (err) {
    console.error("Error during verification:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function updateNameAndCell(
  email: string,
  name: string,
  cell: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(
      `SELECT * FROM update_name_and_cell($1, $2, $3)`,
      [email, name, cell]
    );

    const row = result.rows[0];

    if (!row.success) {
      return { success: false, error: row.error };
    }

    return { success: true };
  } catch (err) {
    console.error("Error updating name and cell:", err);
    return { success: false, error: (err as Error).message };
  }
}
