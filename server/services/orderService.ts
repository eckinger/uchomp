import { pool } from "../db/db";
import { LOCATION } from "../models/location";

export async function getOrders(
  location?: LOCATION
): Promise<{
  success: boolean;
  location?: LOCATION;
  orders: any[];
  error?: string;
}> {
  try {
    const result = await pool.query("SELECT * FROM get_orders($1)", [
      location ?? null,
    ]);

    const row = result.rows[0];

    return {
      success: row.success,
      location: row.location,
      orders: row.orders ?? [],
      error: row.error ?? undefined,
    };
  } catch (err) {
    console.error("Error fetching orders:", err);
    return {
      success: false,
      orders: [],
      error: (err as Error).message,
    };
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
    // TODO: gracefully catch enum loc error. This works fine for now but is ugly
    console.error("Error creating order:", err);
    if ((err as Error).message.includes("invalid input value for enum locs")) {
      return { success: false, error: "Invalid Location Enum" };
    }
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
    const result = await pool.query(`SELECT * FROM join_order($1, $2)`, [
      userId, orderId,
    ]);

    const row = result.rows[0];

    return { success: row.success, error: row.error };

  } catch (e) {
    console.error("Error joining group:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function leaveOrder(
  userId: string,
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(
      'SELECT * FROM leave_order($1, $2)', [
      userId, orderId
    ]);

    const row = result.rows[0];

    return { success: row.success, error: row.error };
  } catch (e) {
    console.error("Error leaving Order:", e);
    return { success: false, error: (e as Error).message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  isOpen: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await pool.query(
      `SELECT * FROM update_order_status($1, $2)`,
      [orderId, isOpen]
    );

    const row = result.rows[0];
    return { success: row.success, error: row.error };
  } catch (err) {
    console.error("Error updating order status:", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function getOrderDetails(
  orderId: string
): Promise<{
  success: boolean;
  error?: string;
  orderDetails?: any;
}> {
  try {
    const result = await pool.query(
      `SELECT * FROM get_order_details($1)`,
      [orderId]
    );

    const row = result.rows[0];
    return {
      success: row.success,
      error: row.error,
      orderDetails: row.order_details
    };
  } catch (err) {
    console.error("Error getting order details:", err);
    return {
      success: false,
      error: (err as Error).message
    };
  }
}

