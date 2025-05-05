import { pool } from "../db/db";
//code implemented below does not use verification

// code generator
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Insert or update a code for an email
export async function send_code(email: string): Promise<{ success: boolean; code: string }> {
  const code = generateCode();
  try {
    await pool.query(
      `INSERT INTO code (email, key) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET key = $2`,
      [email, code]
    );
    console.log(`Generated code for ${email}: ${code}`);
    return { success: true, code };
  } catch (err) {
    console.error("Error inserting code:", err);
    return { success: false, code: "" };
  }
}

// Directly add or update a user
export async function save_user(name: string, cell: string): Promise<{ success: boolean }> {
  try {
    await pool.query(
      `INSERT INTO "user" (name, cell) VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET cell = $2`,
      [name, cell]
    );
    return { success: true };
  } catch (err) {
    console.error("Error saving user:", err);
    return { success: false };
  }
}
