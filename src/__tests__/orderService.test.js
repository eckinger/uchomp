// Currently, we assume we have a `db` variable for our tests
// As part of the implementation, we will mock this behavior with Docker and Postgres

// Test suite for order_service methods
describe("Order Service Tests", () => {
  // Clean up database after each test
  afterEach(async () => {
    await db.query("DELETE FROM order_group");
    await db.query("DELETE FROM food_order");
    await db.query('DELETE FROM "user"');
  });

  // Setup: Create test user
  beforeAll(async () => {
    await db.query(
      'INSERT INTO "user" (email, name, cell) VALUES ($1, $2, $3)',
      ["order_owner@example.com", "Order Owner", "555-555-5555"],
    );

    const userRecord = await db.query(
      'SELECT id FROM "user" WHERE email = $1',
      ["order_owner@example.com"],
    );
    testUserId = userRecord.rows[0].id;
  });

  // Tests for create_order function
  describe("create_order", () => {
    test("should create a new order with valid inputs", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1); // Expires in 1 hour
      const meetupLocation = "Regenstein Library"; // Valid campus location

      const result = await order_service.create_order(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(true);
      expect(result.order_id).toBeDefined();

      // Verify order was inserted into food_order table
      const orderRecord = await db.query(
        "SELECT * FROM food_order WHERE id = $1",
        [result.order_id],
      );
      expect(orderRecord.rows.length).toBe(1);
      expect(orderRecord.rows[0].owner_id).toBe(testUserId);
      expect(orderRecord.rows[0].restaurant).toBe(restaurant);
      expect(orderRecord.rows[0].expiration).toEqual(expiration);
      expect(orderRecord.rows[0].loc).toBe(meetupLocation);
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
        const result = await order_service.create_order(
          testUserId,
          restaurant,
          expiration,
          meetupLocation,
        );
        expect(result.success).toBe(true);

        const orderRecord = await db.query(
          "SELECT loc FROM food_order WHERE id = $1",
          [result.order_id],
        );
        expect(orderRecord.rows[0].loc).toBe(meetupLocation);
      }
    });

    test("should reject invalid campus location", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const invalidLocation = "Invalid Location"; // Not in the locs enum

      await expect(
        order_service.create_order(
          testUserId,
          restaurant,
          expiration,
          invalidLocation,
        ),
      ).rejects.toThrow(/invalid location/i);
    });

    test("should reject empty restaurant name", async () => {
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      await expect(
        order_service.create_order(testUserId, "", expiration, meetupLocation),
      ).rejects.toThrow(/restaurant.*required/i);
    });

    test("should reject past expiration time", async () => {
      const restaurant = "Test Restaurant";
      const pastExpiration = new Date();
      pastExpiration.setHours(pastExpiration.getHours() - 1); // 1 hour in the past
      const meetupLocation = "Harper Library";

      await expect(
        order_service.create_order(
          testUserId,
          restaurant,
          pastExpiration,
          meetupLocation,
        ),
      ).rejects.toThrow(/expiration.*future/i);
    });

    test("should reject nonexistent user ID", async () => {
      const restaurant = "Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "John Crerar Library";

      const invalidUserId = 9999; // Assuming this ID doesn't exist

      await expect(
        order_service.create_order(
          invalidUserId,
          restaurant,
          expiration,
          meetupLocation,
        ),
      ).rejects.toThrow(/user not found/i);
    });

    test("should handle very long restaurant names", async () => {
      // Generate a very long restaurant name
      const longName = "A".repeat(255); // Assuming varchar(255) limit
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      try {
        const result = await order_service.create_order(
          testUserId,
          longName,
          expiration,
          location,
        );
        expect(result.success).toBe(true);

        const orderRecord = await db.query(
          "SELECT restaurant FROM food_order WHERE id = $1",
          [result.order_id],
        );
        expect(orderRecord.rows[0].restaurant).toBe(longName);
      } catch (error) {
        // If error occurs, it should be specific to character limit
        expect(error.message).toMatch(/restaurant.*too long/i);
      }
    });
  });

  // Tests for delete_order function
  describe("delete_order", () => {
    let testOrderId;

    // Setup: Create a test order
    beforeEach(async () => {
      const restaurant = "Delete Test Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await order_service.create_order(
        testUserId,
        restaurant,
        expiration,
        meetupLocation,
      );
      testOrderId = result.order_id;
    });

    test("should delete an existing order", async () => {
      const result = await order_service.delete_order(testOrderId);
      expect(result.success).toBe(true);

      // Verify order was removed from food_order table
      const orderRecord = await db.query(
        "SELECT * FROM food_order WHERE id = $1",
        [testOrderId],
      );
      expect(orderRecord.rows.length).toBe(0);
    });

    test("should handle deleting nonexistent order", async () => {
      const invalidOrderId = 9999; // Assuming this ID doesn't exist

      const result = await order_service.delete_order(invalidOrderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    test("should cascade delete any related food orders", async () => {
      // Add a order_group related to the food_order
      await db.query(
        "INSERT INTO order_group (food_order_id, user_id) VALUES ($1, $2)",
        [testOrderId, testUserId],
      );

      // Delete the order
      const result = await order_service.delete_order(testOrderId);
      expect(result.success).toBe(true);

      // Verify related order_group was also removed
      const foodOrderRecords = await db.query(
        "SELECT * FROM order_group WHERE food_order_id = $1",
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
      await user_service.send_code(email);

      const codeRecord = await db.query(
        "SELECT key FROM code WHERE email = $1",
        [email],
      );
      const code = codeRecord.rows[0].key;

      await user_service.verify(email, code);
      await user_service.get_name_and_cell(email, "New User", "555-123-7890");

      // Get user ID
      const userRecord = await db.query(
        'SELECT id FROM "user" WHERE email = $1',
        [email],
      );
      const userId = userRecord.rows[0].id;

      // Create an order
      const restaurant = "Integration Restaurant";
      const expiration = new Date();
      expiration.setHours(expiration.getHours() + 1);
      const meetupLocation = "Regenstein Library";

      const result = await order_service.create_order(
        userId,
        restaurant,
        expiration,
        meetupLocation,
      );
      expect(result.success).toBe(true);
      expect(result.order_id).toBeDefined();

      // Verify order details
      const orderRecord = await db.query(
        "SELECT * FROM food_order WHERE id = $1",
        [result.order_id],
      );
      expect(orderRecord.rows[0].owner_id).toBe(userId);
      expect(orderRecord.rows[0].restaurant).toBe(restaurant);
      expect(orderRecord.rows[0].loc).toBe(meetupLocation);
    });
  });
});
