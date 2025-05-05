import { pool } from "../db/db";

export async function create_order(
  owner_id: number,
  restaurant: string,
  expiration: string
): Promise<{ success: boolean; order_id?: number }> {
  try {
    const result = await pool.query(
      `INSERT INTO "order" (owner_id, restaurant, expiration)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [owner_id, restaurant, expiration]
    );

    return { success: true, order_id: result.rows[0].id };
  } catch (err) {
    console.error("Error creating order:", err);
    return { success: false };
  }
}

export async function delete_order(order_id: number): Promise<{ success: boolean }> {
    try {
      const result = await pool.query(
        `DELETE FROM "order" WHERE id = $1`,
        [order_id]
      );
  
      return { success: result.rowCount! > 0 };
    } catch (err) {
      console.error("Error deleting order:", err);
      return { success: false };
    }
}
