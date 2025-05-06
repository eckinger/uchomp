import { pool } from "../db/db";

// code generator
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Insert or update a code for an email
export async function sendCode(
  email: string
): Promise<{ success: boolean; code: string; error?: string }> {
  const code = generateCode();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Invalid email");
  }

  try {
    // Create the user if they didn't exist before
    await pool.query("CALL ensure_user_exists($1)", [email]);

    // Now insert or update the code
    await pool.query(
      "CALL create_verification_code($1::text, $2::int, NOW()::timestamp)",
      [email, code]
    );
    console.log(`Generated code for ${email}: ${code}`);
    return { success: true, code };
  } catch (err) {
    console.error("Error inserting code:", err);
    return {
      success: false,
      code: "",
      error: `Database error: ${(err as Error).message}`,
    };
  }
}

export async function verify(
  email: string,
  code: string
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

    return { success: true };
  } catch (err) {
    console.error("Error during verification:", err);
    return { success: false, error: (err as Error).message };
  }
}

// Adds or updates the name and phone for a user identified by email
export async function getNameAndCell(
  email: string,
  name: string,
  cell: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format (simple validation)
    if (!/^\d{3}-\d{3}-\d{4}$/.test(cell)) {
      throw new Error("Invalid phone number format. Use XXX-XXX-XXXX format.");
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userCheck.rows.length === 0) {
      throw new Error("User not found.");
    }

    // Update user information
    const result = await pool.query(
      `UPDATE users SET name = $2, cell = $3 WHERE email = $1 RETURNING id`,
      [email, name, cell]
    );

    if (result.rows.length === 0) {
      return { success: false, error: "Failed to update user information." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error updating name and cell:", err);
    if ((err as Error).message.includes("User not found")) {
      throw new Error("User not found.");
    } else if ((err as Error).message.includes("Invalid phone")) {
      throw new Error("Invalid phone number format.");
    }
    return { success: false, error: (err as Error).message };
  }
}

// Optional helper function to save user (not required by tests but might be useful)
export async function save_user(
  name: string,
  cell: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!/^\d{3}-\d{3}-\d{4}$/.test(cell)) {
      throw new Error("Invalid phone number format. Use XXX-XXX-XXXX format.");
    }

    await pool.query(
      `INSERT INTO users (name, cell, email) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = $1, cell = $2`,
      [name, cell, email]
    );
    return { success: true };
  } catch (err) {
    console.error("Error saving user:", err);
    return { success: false, error: (err as Error).message };
  }
}
