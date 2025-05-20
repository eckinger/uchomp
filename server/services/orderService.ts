import { pool } from "../db/db";
import { LOCATION } from "../models/location";

export async function getOrders(location?: LOCATION) {
  try {
    const result = await pool.query("SELECT * FROM get_active_orders()");
    return {
      success: true,
      orders: result.rows,
    };
  } catch (err) {
    console.error("Error fetching orders:", err);
    return { success: false, error: (err as Error).message, orders: [] };
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
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // check order exists and not expired
    const orderCheck = await pool.query(
      "SELECT owner_id, expiration FROM food_orders WHERE id = $1",
      [orderId],
    );

    if (orderCheck.rows.length === 0) {
      return { success: false, error: "Order not found" };
    }

    const order = orderCheck.rows[0];

    // if user trying to join own group
    if (order.owner_id === userId) {
      return { success: false, error: "You cannot join your own order" };
    }

    // check if order expired
    if (new Date(order.expiration) < new Date()) {
      return { success: false, error: "This group has expired" };
    }

    // check if user is already member
    const alreadyMember = await pool.query(
      "SELECT * FROM order_groups WHERE food_order_id = $1 AND user_id = $2",
      [orderId, userId],
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
      [orderId, userId],
    );

    return { success: true };
  } catch (e) {
    console.error("Error joining group:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function leaveOrder(
  userId: string,
  orderId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // check order exists
    const orderCheck = await pool.query(
      "SELECT owner_id, expiration FROM food_orders WHERE id = $1",
      [orderId],
    );

    if (orderCheck.rows.length === 0) {
      return { success: false, error: "Order not found" };
    }

    // check if user is already member
    const alreadyMember = await pool.query(
      "SELECT * FROM order_groups WHERE food_order_id = $1 AND user_id = $2",
      [orderId, userId],
    );

    if (alreadyMember.rows.length === 0) {
      console.log("Here: (2)");
      return {
        success: false,
        error: "You are not a member of this order",
      };
    }

    const isOwner = orderCheck.rows[0].owner_id === userId;

    if (isOwner) {
      const nextMemberResult = await pool.query(
        "SELECT user_id FROM order_groups WHERE food_order_id = $1 AND user_id != $2 ORDER BY created_at ASC LIMIT 1",
        [orderId, userId],
      );

      if (nextMemberResult.rows.length > 0) {
        const nextOwnerId = nextMemberResult.rows[0].user_id;
        await pool.query("UPDATE food_orders SET owner_id = $1 WHERE id = $2", [
          nextOwnerId,
          orderId,
        ]);
      }
    }

    // Remove user from order
    await pool.query(
      "DELETE FROM order_groups WHERE food_order_id = $1 AND user_id = $2",
      [orderId, userId],
    );

    // Check if there are any members left in the order
    const remainingMembersResult = await pool.query(
      "SELECT COUNT(*) as count FROM order_groups WHERE food_order_id = $1",
      [orderId],
    );

    const remainingMembers = parseInt(remainingMembersResult.rows[0].count);

    // If no members left, delete the order
    if (remainingMembers === 0) {
      await pool.query("DELETE FROM food_orders WHERE id = $1", [orderId]);
    }

    // Commit transaction

    return { success: true };
  } catch (e) {
    console.error("Error leaving group:", e);
    return { success: false, error: (e as Error).message };
  }
}
