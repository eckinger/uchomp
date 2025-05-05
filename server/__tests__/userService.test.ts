import * as user_service from "../services/userService";
import { pool as db } from "../db/db";
import { randomUUID } from "crypto";
let testUserId: string;

async function createTestUser(): Promise<string> {
  const id = randomUUID();
  await db.query(
    'INSERT INTO "user" (id, email, name, cell) VALUES ($1, $2, $3, $4)',
    [id, `user_${id}@example.com`, "Test User", "555-555-5555"]
  );
  return id;
}

beforeEach(async () => {
  testUserId = await createTestUser();
});

// Clean up database after each test
afterEach(async () => {
  await db.query('DELETE FROM food_order');
  await db.query('DELETE FROM order_group');
  await db.query('DELETE FROM code');
  await db.query('DELETE FROM "user"');

});

describe("User Service Tests", () => {
  
    // Tests for send_code function
    describe("send_code", () => {
      // Test valid email input
      test("should generate a code, store it in code table, and send email successfully", async () => {
        const email = "test@example.com";
        const result = await user_service.send_code(email);
        expect(result.success).toBe(true);
  
        // Verify code was inserted into code table
        const codeRecord = await db.query(
          "SELECT key FROM code WHERE email = $1",
          [email],
        );
        expect(codeRecord.rows.length).toBe(1);
        expect(codeRecord.rows[0].key).toBeDefined();
      });
  
      // Test invalid email format
      test("should reject invalid email formats", async () => {
        const invalidEmail = "invalid-email";
        await expect(user_service.send_code(invalidEmail)).rejects.toThrow();
      });
  
      // Test duplicate email request
      test("should handle repeated requests from same email", async () => {
        const email = "repeat@example.com";
        await user_service.send_code(email);
        const result = await user_service.send_code(email);
  
        // Should update existing code rather than creating duplicate
        const codeRecords = await db.query(
          "SELECT * FROM code WHERE email = $1",
          [email],
        );
        expect(codeRecords.rows.length).toBe(1);
      });
    });
  
    // Tests for verify function
    describe("verify", () => {
      // Setup: Insert test code
      beforeEach(async () => {
        await db.query(
          "INSERT INTO code (email, key, created_at) VALUES ($1, $2, $3)",
          ["verify@example.com", "123456", new Date()],
        );
      });
  
      // Test successful verification
      test("should verify correct code, create user, and remove code", async () => {
        const email = "verify@example.com";
        const code = "123456";
  
        const result = await user_service.verify(email, code);
        expect(result.success).toBe(true);
  
        // Code should be removed from code table
        const codeRecord = await db.query("SELECT * FROM code WHERE email = $1", [
          email,
        ]);
        expect(codeRecord.rows.length).toBe(0);
  
        // User should be added to user table
        const userRecord = await db.query(
          'SELECT * FROM "user" WHERE email = $1',
          [email],
        );
        expect(userRecord.rows.length).toBe(1);
      });
  
      // test correct ID
      test("should generate a valid user ID upon successful verification", async () => {
        const email = "verify@example.com";
        const code = "123456";
  
        // Verify the code which should create a user
        const result = await user_service.verify(email, code);
        expect(result.success).toBe(true);
  
        // Check that user was created with a valid ID
        const userRecord = await db.query(
          'SELECT id FROM "user" WHERE email = $1',
          [email],
        );
        expect(userRecord.rows.length).toBe(1);
        expect(userRecord.rows[0].id).toBeDefined();
        expect(typeof userRecord.rows[0].id).toBe("string");
        expect(userRecord.rows[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });
  
      // Test incorrect code
      test("should reject incorrect verification code", async () => {
        const email = "verify@example.com";
        const wrongCode = "999999";
  
        const result = await user_service.verify(email, wrongCode);
        expect(result.success).toBe(false);
  
        // Code should still exist in code table
        const codeRecord = await db.query("SELECT * FROM code WHERE email = $1", [
          email,
        ]);
        expect(codeRecord.rows.length).toBe(1);
      });
  
      // Test expired code
      test("should reject expired verification codes", async () => {
        // Insert an expired code (more than 10 minutes old)
        const expiredDate = new Date();
        expiredDate.setMinutes(expiredDate.getMinutes() - 15);
  
        await db.query(
          "INSERT INTO code (email, key, created_at) VALUES ($1, $2, $3)",
          ["expired@example.com", "123456", expiredDate],
        );
  
        const result = await user_service.verify("expired@example.com", "123456");
        expect(result.success).toBe(false);
        expect(result.error).toContain("expired");
      });
    });
  
    // Tests for get_name_and_cell function
    describe("get_name_and_cell", () => {
      // Setup: Insert test user
      beforeEach(async () => {
        await db.query('INSERT INTO "user" (email) VALUES ($1)', [
          "profile@example.com",
        ]);
      });
  
      // Test successful profile update
      test("should update user profile with name and cell number", async () => {
        const email = "profile@example.com";
        const name = "Test User";
        const cell = "123-456-7890";
  
        const result = await user_service.get_name_and_cell(email, name, cell);
        expect(result.success).toBe(true);
  
        // User data should be updated in user table
        const userRecord = await db.query(
          'SELECT * FROM "user" WHERE email = $1',
          [email],
        );
        expect(userRecord.rows.length).toBe(1);
        expect(userRecord.rows[0].name).toBe(name);
        expect(userRecord.rows[0].cell).toBe(cell);
      });
  
      // Test invalid cell format
      test("should reject invalid cell number formats", async () => {
        const email = "profile@example.com";
        const name = "Test User";
        const invalidCell = "not-a-phone";
  
        await expect(
          user_service.get_name_and_cell(email, name, invalidCell),
        ).rejects.toThrow(/invalid phone/i);
      });
  
      // Test nonexistent user
      test("should handle updating nonexistent user", async () => {
        const email = "nonexistent@example.com";
        const name = "Test User";
        const cell = "123-456-7890";
  
        await expect(
          user_service.get_name_and_cell(email, name, cell),
        ).rejects.toThrow(/user not found/i);
      });
    });
  
    // Integration tests between methods
    describe("Integration Tests", () => {
      test("full user registration flow: send code, verify, update profile", async () => {
        const email = "integration@example.com";
        const name = "Integration Test";
        const cell = "555-123-4567";
  
        // Step 1: Send verification code
        const sendResult = await user_service.send_code(email);
        expect(sendResult.success).toBe(true);
  
        // Get the code from the database for testing purposes
        const codeRecord = await db.query(
          "SELECT key FROM code WHERE email = $1",
          [email],
        );
        const code = codeRecord.rows[0].key;
  
        // Step 2: Verify the code
        const verifyResult = await user_service.verify(email, code);
        expect(verifyResult.success).toBe(true);
  
        // Step 3: Complete profile
        const profileResult = await user_service.get_name_and_cell(
          email,
          name,
          cell,
        );
        expect(profileResult.success).toBe(true);
  
        // Verify final user state
        const userRecord = await db.query(
          'SELECT * FROM "user" WHERE email = $1',
          [email],
        );
        expect(userRecord.rows.length).toBe(1);
        expect(userRecord.rows[0].email).toBe(email);
        expect(userRecord.rows[0].name).toBe(name);
        expect(userRecord.rows[0].cell).toBe(cell);
      });
    });
  
    // Mock database failure tests
    describe("Database Error Handling", () => {
      test("should handle database connection errors gracefully", async () => {
        // Mock database failure
        jest
          .spyOn(db, "query")
          .mockImplementationOnce(() => {
            throw new Error("Database connection error");
          });
  
        const email = "error@example.com";
        const result = await user_service.send_code(email);
  
        expect(result.success).toBe(false);
        expect(result.error && result.error.toLowerCase()).toContain("database connection error");
      });
    });
  });
  