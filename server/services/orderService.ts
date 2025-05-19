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
  loc: string,
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const result = await pool.query(
      `SELECT * FROM create_food_order($1, $2, $3, $4)`,
      [owner_id, restaurant, expiration, loc],
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
  orderId: string,
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

export async function joinOrder(
  userId: string,
  groupId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // check order exists and not expired
    const orderCheck = await pool.query(
      "SELECT owner_id, expiration FROM food_orders WHERE id = $1",
      [groupId],
    );

    if (orderCheck.rows.length === 0) {
      return { success: false, error: "Order not found" };
    }

    const order = orderCheck.rows[0];

    // if user trying to join own group
    if (order.owner_id === userId) {
      return { success: false, error: "You cannot join your own group" };
    }

    // check if order expired
    if (new Date(order.expiration) < new Date()) {
      return { success: false, error: "This group has expired" };
    }

    // check if user is already member
    const alreadyMember = await pool.query(
      "SELECT * FROM order_groups WHERE food_order_id = $1 AND user_id = $2",
      [groupId, userId],
    );

    if (alreadyMember.rows.length > 0) {
      return {
        success: false,
        error: "You are already a member of this group",
      };
    }

    // add user to group
    await pool.query(
      "INSERT INTO order_groups (food_order_id, user_id) VALUES ($1, $2)",
      [groupId, userId],
    );

    return { success: true };
  } catch (e) {
    console.error("Error joining group:", e);
    return { success: false, error: (e as Error).message };
  }
}
