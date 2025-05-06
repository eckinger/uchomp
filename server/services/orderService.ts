import { pool } from "../db/db";

// Create a new food order
export async function create_order(
  owner_id: number | string,
  restaurant: string,
  expiration: Date,
  loc: string
): Promise<{ success: boolean; order_id?: number; error?: string }> {
  try {
    // Validate inputs
    if (!restaurant || restaurant.trim() === "") {
      throw new Error("Restaurant name is required.");
    }

    const expirationDate = new Date(expiration);
    if (isNaN(expirationDate.getTime())) {
      throw new Error("Invalid expiration date.");
    }

    if (expirationDate.getTime() < Date.now()) {
      throw new Error("Expiration must be in the future.");
    }


    // Validate location against enum values
    const validLocations = [
      "Regenstein Library",
      "Harper Library",
      "John Crerar Library",
    ];
    if (!validLocations.includes(loc)) {
      throw new Error("Invalid location.");
    }

    // Confirm user exists
    const userCheck = await pool.query(
      `SELECT id FROM "user" WHERE id = $1`,
      [owner_id]
    );
    if (userCheck.rows.length === 0) {
      throw new Error("User not found.");
    }

    // Insert the food order
    const result = await pool.query(
      `INSERT INTO food_order (owner_id, restaurant, expiration, loc)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [owner_id, restaurant, expiration, loc]
    );

    return { success: true, order_id: result.rows[0].id };
  } catch (err) {
    console.error("Error creating order:", err);
    throw err; // Re-throw to allow tests to catch specific error messages
  }
}

// Delete an existing food order
export async function delete_order(order_id: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if the order exists
    const checkOrder = await pool.query(
      `SELECT id FROM food_order WHERE id = $1`,
      [order_id]
    );
    
    if (checkOrder.rows.length === 0) {
      return { success: false, error: "Order not found." };
    }

    // Delete related rows in order_group first (if ON DELETE CASCADE isn't set)
    await pool.query(
      `DELETE FROM order_group WHERE food_order_id = $1`,
      [order_id]
    );

    // Delete the order
    const result = await pool.query(
      `DELETE FROM food_order WHERE id = $1`,
      [order_id]
    );

    if (result.rowCount === 0) {
      return { success: false, error: "Order not found." };
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting order:", err);
    return { success: false, error: (err as Error).message };
  }
}

// Get all active food orders
export async function get_orders(): Promise<{ success: boolean; orders?: any[]; error?: string }> {
  try {
    // Get all active orders (where expiration is in the future)
    const result = await pool.query(
      `SELECT fo.id, fo.owner_id, fo.restaurant, fo.expiration, fo.loc, 
       (SELECT COUNT(og.user_id) FROM order_group og WHERE og.food_order_id = fo.id) as participant_count,
       (SELECT ARRAY_AGG(og.user_id) FROM order_group og WHERE og.food_order_id = fo.id) as participants
       FROM food_order fo
       WHERE fo.expiration > NOW()
       ORDER BY fo.expiration ASC`
    );

    return {
      success: true,
      orders: result.rows
    };
  } catch (err) {
    console.error("Error fetching orders:", err);
    return { success: false, error: (err as Error).message };
  }
}
