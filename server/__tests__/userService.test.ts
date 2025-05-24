import * as userService from "../services/userService";
import * as notificationService from "../services/notificationService";
import { pool as db } from "../db/db";

beforeEach(async () => {
  await db.query("BEGIN");
  jest.clearAllMocks();
});

// Clean up database after each test
afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(() => {
  db.end();
});

describe("User Service Tests", () => {
  // Tests for sendCode function
  describe("sendCode", () => {
    // Test valid email input
    test("should generate a code, store it in code table", async () => {
      const email = "test@example.com";
      const result = await userService.sendCode(email);
      expect(result.success).toBe(true);

      // Verify code was inserted into code table
      const codeRecord = await db.query(
        "SELECT key FROM codes WHERE email = $1",
        [email]
      );
      expect(codeRecord.rows.length).toBe(1);
      expect(codeRecord.rows[0].key).toBeDefined();
    });

    // Test invalid email format
    test("should reject invalid email formats", async () => {
      const invalidEmail = "invalid-email";
      await expect(userService.sendCode(invalidEmail)).rejects.toThrow();
    });

    // Test duplicate email request
    test("should handle repeated requests from same email", async () => {
      const email = "repeat@example.com";
      await userService.sendCode(email);
      const result = await userService.sendCode(email);

      // Should update existing code rather than creating duplicate
      const codeRecords = await db.query(
        "SELECT * FROM codes WHERE email = $1",
        [email]
      );
      expect(result.success).toBe(true);
      expect(codeRecords.rows.length).toBe(1);
    });
  });

  // Tests for verify function
  describe("verify", () => {
    const email = "verify@example.com";
    let code = 0;

    // Setup: Insert test code
    beforeEach(async () => {
      const response = await userService.sendCode(email);
      code = response.code ?? 0;
    });

    // Test successful verification
    test("should verify correct code", async () => {
      debugger;
      const result = await userService.verify(email, code);
      expect(result.success).toBe(true);
    });

    // Test incorrect code
    test("should reject incorrect verification code", async () => {
      const wrongCode = 999999;

      const result = await userService.verify(email, wrongCode);
      expect(result.success).toBe(false);

      // Code should still exist in code table
      const codeRecord = await db.query(
        "SELECT * FROM codes WHERE email = $1",
        [email]
      );
      expect(codeRecord.rows.length).toBe(1);
    });

    // Test expired code
    test("should reject expired verification codes", async () => {
      // Insert an expired code (more than 10 minutes old)
      const expiredDate = new Date();
      expiredDate.setMinutes(expiredDate.getMinutes() - 15);

      await db.query(
        "INSERT INTO codes (email, key, created_at) VALUES ($1, $2, $3)",
        ["expired@example.com", 123456, expiredDate]
      );

      const result = await userService.verify("expired@example.com", 123456);
      expect(result.success).toBe(false);
      expect(result.error).toContain("expired");
    });
  });

  // Tests for get_name_and_cell function
  describe("get_name_and_cell", () => {
    // Setup: Insert test user
    beforeEach(async () => {
      await db.query("INSERT INTO users (email) VALUES ($1)", [
        "profile@example.com",
      ]);
    });

    // Test successful profile update
    test("should update user profile with name and cell number", async () => {
      const email = "profile@example.com";
      const name = "Test User";
      const cell = "123-456-7890";

      const result = await userService.updateNameAndCell(email, name, cell);
      expect(result.success).toBe(true);

      // User data should be updated in user table
      const userRecord = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
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

      const result = await userService.updateNameAndCell(
        email,
        name,
        invalidCell
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid phone number format");
    });

    // Test nonexistent user
    test("should handle updating nonexistent user", async () => {
      const email = "nonexistent@example.com";
      const name = "Test User";
      const cell = "123-456-7890";

      const result = await userService.updateNameAndCell(email, name, cell);

      expect(result.success).toBe(false);
      expect(result.error).toContain("User not found");
    });
  });

  test("should send a join notification email", async () => {
    const emailService = require("resend");
    const resendInstance = new emailService.Resend();
    const sendMock = resendInstance.emails.send;

    const userEmail = "user@example.com";
    const groupName = "Pizza Lovers";

    const result = await notificationService.sendJoinNotification(
      userEmail,
      groupName
    );

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        subject: expect.stringContaining("Welcome"),
        html: expect.stringContaining(groupName),
      })
    );
  });

  test("should send expiration notification email", async () => {
    const emailService = require("resend");
    const resendInstance = new emailService.Resend();
    const sendMock = resendInstance.emails.send;

    const userEmail = "user@example.com";
    const groupName = "Sushi Squad";
    const expirationTime = new Date(Date.now() + 3600000); // 1 hour

    const result = await notificationService.sendExpirationNotification(
      userEmail,
      groupName,
      expirationTime
    );

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        subject: expect.stringContaining("expiring"),
        html: expect.stringContaining(groupName),
      })
    );
  });

  test("should send a leave notification email", async () => {
    const emailService = require("resend");
    const resendInstance = new emailService.Resend();
    const sendMock = resendInstance.emails.send;

    const userEmail = "user@example.com";
    const groupName = "Taco Tuesday";

    const result = await notificationService.sendLeaveNotification(
      userEmail,
      groupName
    );

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        subject: expect.stringContaining("Left"),
        html: expect.stringContaining(groupName),
      })
    );
  });

  // Integration tests between methods
  describe("Integration Tests", () => {
    test("full user registration flow: send code, verify, update profile", async () => {
      const email = "integration@example.com";
      const name = "Integration Test";
      const cell = "555-123-4567";

      // Step 1: Send verification code
      const sendResult = await userService.sendCode(email);
      expect(sendResult.success).toBe(true);

      // Get the code from the database for testing purposes
      const codeRecord = await db.query(
        "SELECT key FROM codes WHERE email = $1",
        [email]
      );
      const code = codeRecord.rows[0].key;

      // Step 2: Verify the code
      const verifyResult = await userService.verify(email, code);
      expect(verifyResult.success).toBe(true);

      // Step 3: Complete profile
      const profileResult = await userService.updateNameAndCell(
        email,
        name,
        cell
      );
      expect(profileResult.success).toBe(true);

      // Verify final user state
      const userRecord = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
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
      jest.spyOn(db, "query").mockImplementationOnce(() => {
        throw new Error("Database connection error");
      });

      const email = "error@example.com";
      const result = await userService.sendCode(email);

      expect(result.success).toBe(false);
      expect(result.error && result.error.toLowerCase()).toContain(
        "database connection error"
      );
    });
  });
});
