import * as orderService from "../services/orderService";
import * as userService from "../services/userService";
import { pool as db } from "../db/db";
import { randomUUID } from "crypto";
let testUserId: string;

async function createTestUser(): Promise<string> {
  const id = randomUUID();
  await db.query(
    "INSERT INTO users (id, email, name, cell) VALUES ($1, $2, $3, $4)",
    [id, `user_${id}@example.com`, "Test User", "555-555-5555"],
  );
  return id;
}

beforeEach(async () => {
  await db.query("BEGIN");
  testUserId = await createTestUser();
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(() => {
  db.end();
});

// Currently, we assume we have a `db` variable for our tests
// As part of the implementation, we will mock this behavior with Docker and Postgres

// Test suite for order_service methods
describe("Order Service Tests", () => {
  // Tests for create_order function
  describe("create_order", () => {
    test("should create a new order with valid inputs", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1); // Expires in 1 hour
      const meetupLocation = "Regenstein Library"; // Valid campus location

      const result = await orderService.createOrder(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    // Test all valid campus locations
    test("should accept all valid campus locations", async () => {
      const restaurant = "Location Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);

      // Test each valid location from the locs enum
      const validLocations = [
        "Regenstein Library",
        "Harper Library",
        "John Crerar Library",
      ];

      for (const meetupLocation of validLocations) {
        const result = await orderService.createOrder(
          testUserId,
          restaurant,
          expiration,
          meetupLocation,
        );
        expect(result.success).toBe(true);

        const orderRecord = await db.query(
          "SELECT location FROM food_orders WHERE id = $1",
          [result.orderId],
        );
        expect(orderRecord.rows[0].location).toBe(meetupLocation);
      }
    });

    test("should reject invalid campus location", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const invalidLocation = "Invalid Location"; // Not in the locs enum in the database

      const result = await orderService.createOrder(
        testUserId,
        restaurant,
        expiration,
        invalidLocation,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid Location");
    });

    test("should reject empty restaurant name", async () => {
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await orderService.createOrder(
        testUserId,
        "",
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Restaurant name is required.");
    });

    test("should reject past expiration time", async () => {
      const restaurant = "Test Restaurant";
      const pastExpiration = new Date();
      const meetupLocation = "Harper Library";
      pastExpiration.setHours(pastExpiration.getHours() - 1); // 1 hour in the past

      const result = await orderService.createOrder(
        testUserId,
        restaurant,
        pastExpiration,
        meetupLocation,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Expiration must be in the future");
    });

    test("should reject nonexistent user ID", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "John Crerar Library";

      const fakeUUID = "123e4567-e89b-12d3-a456-426614174000";

      const result = await orderService.createOrder(
        fakeUUID,
        restaurant,
        new Date(Date.now() + 10000),
        meetupLocation,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("User not found");
    });

    test("should handle very long restaurant names", async () => {
      // Generate a very long restaurant name
      const longName = "A".repeat(255); // Assuming varchar(255) limit
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";
      const userEmail = "longname@example.com";
      const longNameUserId = randomUUID();

      await db.query("INSERT INTO users (id, email) VALUES ($1, $2)", [
        longNameUserId,
        userEmail,
      ]);

      try {
        const result = await orderService.createOrder(
          testUserId,
          longName,
          expiration,
          meetupLocation,
        );
        expect(result.success).toBe(true);

        const orderRecord = await db.query(
          "SELECT restaurant FROM food_orders WHERE id = $1",
          [result.orderId],
        );
        expect(orderRecord.rows[0].restaurant).toBe(longName);
      } catch (error) {
        // If error occurs, it should be specific to character limit
        if (error instanceof Error) {
          expect(error.message).toMatch(/restaurant.*too long/i);
        } else {
          throw error;
        }
      }
    });
  });

  // Tests for deleteOrder function
  describe("deleteOrder", () => {
    let testOrderId: string;

    // Setup: Create a test order
    beforeEach(async () => {
      const restaurant = "Delete Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await orderService.createOrder(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      if (result.orderId === undefined) {
        throw new Error("Order ID is undefined");
      }
      testOrderId = result.orderId.toString();
    });

    test("should delete an existing order", async () => {
      const result = await orderService.deleteOrder(testOrderId);
      expect(result.success).toBe(true);

      // Verify order was removed from food_orders table
      const orderRecord = await db.query(
        "SELECT * FROM food_orders WHERE id = $1",
        [testOrderId],
      );
      expect(orderRecord.rows.length).toBe(0);
    });

    test("should handle deleting nonexistent order", async () => {
      const invalidOrderId = "123e4567-e89b-12d3-a456-426614174000";

      const result = await orderService.deleteOrder(invalidOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    test("should cascade delete any related food orders", async () => {
      // Add a order_groups related to the food_orders
      await db.query("INSERT INTO order_groups (id, user_id) VALUES ($1, $2)", [
        testOrderId,
        testUserId,
      ]);

      // Delete the order
      const result = await orderService.deleteOrder(testOrderId);
      expect(result.success).toBe(true);

      // Verify related order_groups was also removed
      const foodOrderRecords = await db.query(
        "SELECT * FROM order_groups WHERE id = $1",
        [testOrderId],
      );
      expect(foodOrderRecords.rows.length).toBe(0);
    });
  });

  // Integration tests between user and order services
  describe("User-Order Integration", () => {
    test("full user registration and order creation flow", async () => {
      // Register new user
      const email = "newuser@example.com";
      await userService.sendCode(email);

      const codeRecord = await db.query(
        "SELECT key FROM codes WHERE email = $1",
        [email],
      );
      const code = codeRecord.rows[0].key;

      await userService.verify(email, code);
      await userService.updateNameAndCell(email, "New User", "555-123-7890");

      // Get user ID
      const userRecord = await db.query(
        "SELECT id FROM users WHERE email = $1",
        [email],
      );
      const userId = userRecord.rows[0].id;

      // Create an order
      const restaurant = "Integration Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await orderService.createOrder(
        userId,
        restaurant,
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();

      // Verify order details
      const orderRecord = await db.query(
        "SELECT * FROM food_orders WHERE id = $1",
        [result.orderId],
      );
      expect(orderRecord.rows[0].owner_id).toBe(userId);
      expect(orderRecord.rows[0].restaurant).toBe(restaurant);
      expect(orderRecord.rows[0].location).toBe(meetupLocation);
    });
  });

  // Tests for joinGroup function
  describe("joinGroup", () => {
    let testOrderId: string;
    let secondUserId: string;

    // Setup: Create a test order and a second test user
    beforeEach(async () => {
      // Create an order first
      const restaurant = "Join Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await orderService.createOrder(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      if (result.orderId === undefined) {
        throw new Error("Order ID is undefined");
      }
      testOrderId = result.orderId.toString();

      // Create a second test user
      secondUserId = await createTestUser();
    });

    test("should allow a user to join a group", async () => {
      const result = await orderService.joinGroup(secondUserId, testOrderId);
      expect(result.success).toBe(true);

      // Verify user was added to the order_groups table
      const groupRecord = await db.query(
        "SELECT * FROM order_groups WHERE user_id = $1 AND food_order_id = $2",
        [secondUserId, testOrderId],
      );
      expect(groupRecord.rows.length).toBe(1);
    });

    test("should not allow the owner to join their own group", async () => {
      const result = await orderService.joinGroup(testUserId, testOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("cannot join your own group");
    });

    test("should not allow joining a nonexistent group", async () => {
      const fakeOrderId = "123e4567-e89b-12d3-a456-426614174000";
      const result = await orderService.joinGroup(secondUserId, fakeOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Order not found");
    });

    test("should not allow joining an expired group", async () => {
      // Create an expired order
      const restaurant = "Expired Restaurant";
      const pastExpiration = new Date();
      pastExpiration.setHours(pastExpiration.getHours() - 1); // 1 hour in the past
      const meetupLocation = "Harper Library";

      // Manually insert an expired order
      const { rows } = await db.query(
        "INSERT INTO food_orders (owner_id, restaurant, expiration, location) VALUES ($1, $2, $3, $4) RETURNING id",
        [testUserId, restaurant, pastExpiration, meetupLocation],
      );
      const expiredOrderId = rows[0].id;

      const result = await orderService.joinGroup(secondUserId, expiredOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });

    test("should not allow a user to join a group twice", async () => {
      // Join once
      await orderService.joinGroup(secondUserId, testOrderId);

      // Try to join again
      const result = await orderService.joinGroup(secondUserId, testOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("already a member");
    });
  });

  // Tests for createGroup function
  describe("createGroup", () => {
    test("should create a new group with valid inputs and make owner join automatically", async () => {
      const restaurant = "New Group Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 2); // Expires in 2 hours
      const meetupLocation = "John Crerar Library";

      const result = await orderService.createGroup(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(true);
      expect(result.groupId).toBeDefined();

      // Verify order was created
      const orderRecord = await db.query(
        "SELECT * FROM food_orders WHERE id = $1",
        [result.groupId],
      );
      expect(orderRecord.rows.length).toBe(1);
      expect(orderRecord.rows[0].owner_id).toBe(testUserId);

      // Verify owner was automatically added to group
      const memberRecord = await db.query(
        "SELECT * FROM order_groups WHERE food_order_id = $1 AND user_id = $2",
        [result.groupId, testUserId],
      );
      expect(memberRecord.rows.length).toBe(1);
    });

    test("should reject creating a group with invalid location", async () => {
      const restaurant = "Invalid Location Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const invalidLocation = "Student Center"; // Not a valid location

      const result = await orderService.createGroup(
        testUserId,
        restaurant,
        expiration,
        invalidLocation,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid Location");
    });

    test("should reject creating a group with past expiration", async () => {
      const restaurant = "Past Expiration Restaurant";
      const pastExpiration = new Date();
      pastExpiration.setHours(pastExpiration.getHours() - 2); // 2 hours in the past
      const meetupLocation = "Regenstein Library";

      const result = await orderService.createGroup(
        testUserId,
        restaurant,
        pastExpiration,
        meetupLocation,
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain("future");
    });

    test("should set maximum group size if provided", async () => {
      const restaurant = "Limited Size Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Harper Library";
      const maxSize = 5; // Limit to 5 members

      const result = await orderService.createGroup(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
        maxSize,
      );
      expect(result.success).toBe(true);

      // Verify size was set correctly
      const orderRecord = await db.query(
        "SELECT size FROM food_orders WHERE id = $1",
        [result.groupId],
      );
      expect(orderRecord.rows[0].size).toBe(maxSize);
    });
  });
});
