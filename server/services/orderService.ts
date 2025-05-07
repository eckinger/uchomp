import { pool } from "../db/db";

export async function getOrders() {
  const result = await pool.query("SELECT * FROM get_orders()");
  return result.rows;
}

export async function createOrder(
  owner_id: number | string,
  restaurant: string,
  expiration: Date,
  loc: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const result = await pool.query(
      `SELECT * FROM create_food_order($1, $2, $3, $4)`,
      [owner_id, restaurant, expiration, loc]
    );

    const row = result.rows[0];
    if (!row.success) {
      return { success: false, error: row.error };
    }

    return { success: true, orderId: row.order_id };
  } catch (err) {
    console.error("Error creating order:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(`SELECT * FROM delete_order($1)`, [
      orderId,
    ]);

    const row = result.rows[0];

    if (!row.success) {
      return { success: false, error: row.error };
    }

    return { success: true };
  } catch (err) {
    console.error("Error deleting order:", err);
    return { success: false, error: (err as Error).message };
  }
}

// Get all active food orders
export async function getOrders(): Promise<{
  success: boolean;
  orders?: any[];
  error?: string;
}> {
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
      orders: result.rows,
    };
  } catch (err) {
    console.error("Error fetching orders:", err);
    return { success: false, error: (err as Error).message };
  }
}
