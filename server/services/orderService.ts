import { pool } from "../db/db";

export async function getOrders() {
  try {
    const result = await pool.query("SELECT * FROM get_active_orders()");
    return {
      success: true,
      orders: result.rows,
    };
  } catch (err) {
    console.error("Error fetching orders:", err);
    return { success: false, error: (err as Error).message };
  }
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
