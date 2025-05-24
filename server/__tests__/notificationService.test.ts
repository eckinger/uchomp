import { expect, jest, test } from "@jest/globals";
import * as notificationService from "../services/notificationService";
import { pool as db } from "../db/db";
import { randomUUID } from "crypto";
import { Resend } from "resend";
import { mockSend } from "../__mocks__/resend";

// Mock the resend module
jest.mock("resend");

let testUserId: string;

async function createTestUser(): Promise<string> {
  const id = randomUUID();
  await db.query(
    "INSERT INTO users (id, email, name, cell) VALUES ($1, $2, $3, $4)",
    [id, `user_${id}@example.com`, "Test User", "555-555-5555"]
  );
  return id;
}

beforeEach(async () => {
  await db.query("BEGIN");
  testUserId = await createTestUser();
  jest.clearAllMocks();
});

afterEach(async () => {
  await db.query("ROLLBACK");
});

afterAll(() => {
  db.end();
});

describe("Notification Service Tests", () => {
  describe("Email Functionality", () => {
    it("should send an email successfully", async () => {
      const emailData = {
        to: "jgungeon@gmail.com",
        subject: "Test Subject",
        text: "Test Content",
      };
      const expectedCallValues = {
        from: "uchomp@aeckinger.com",
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.text,
      };

      const result = await notificationService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text
      );

      expect(Resend).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledWith(expectedCallValues);
      expect(result.success).toBe(true);
    });

    it("should handle email sending errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Failed to send email"));

      const emailData = {
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test Content",
      };

      const result = await notificationService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.text
      );

      expect(result.success).toBe(false);
    });
  });
});

describe("Group Expiration Notifications", () => {
  test("should send expiration notification when a group expires", async () => {
    const groupId = randomUUID();
    const groupName = "Test Group";
    const expirationTime = new Date(Date.now() + 3600000); // 1 hour from now
    const email = "test@example.com";

    await db.query(
      "INSERT INTO food_orders (id, owner_id, restaurant, expiration) VALUES ($1, $2, $3, $4)",
      [groupId, testUserId, groupName, expirationTime]
    );

    const result = await notificationService.sendExpirationNotification(
      email,
      groupName,
      expirationTime
    );

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "uchomp@aeckinger.com",
        to: email,
        subject: expect.stringContaining("expiring"),
        html: expect.stringContaining(groupName),
      })
    );
  });
});

describe("Join/Leave Notifications", () => {
  test("should send a notification when a user joins a group", async () => {
    const groupName = "Join Test Group";
    const userEmail = "joiner@example.com";

    const result = await notificationService.sendJoinNotification(
      userEmail,
      groupName
    );

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        from: "uchomp@aeckinger.com",
        subject: expect.stringContaining("Welcome"),
        html: expect.stringContaining(groupName),
      })
    );
  });

  test("should send a notification when a user leaves a group", async () => {
    const groupName = "Leave Test Group";
    const userEmail = "leaver@example.com";

    const result = await notificationService.sendLeaveNotification(
      userEmail,
      groupName
    );

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: userEmail,
        from: "uchomp@aeckinger.com",
        subject: expect.stringContaining("Left"),
        html: expect.stringContaining(groupName),
      })
    );
  });
});
