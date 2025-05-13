import * as notificationService from "../services/notificationService";
import { pool as db } from "../db/db";
import { randomUUID } from "crypto";

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  };
});

const Resend = require("resend").Resend;
const resendInstance = new Resend();
const sendMock = resendInstance.emails.send;

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
    test("should send an email using Resend", async () => {
      const email = "test@example.com";
      const subject = "Test Subject";
      const html = "<p>This is a test email</p>";

      const result = await notificationService.sendEmail(email, subject, html);

      expect(result.success).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject,
          html,
        })
      );
    });

    test("should handle email sending errors gracefully", async () => {
      sendMock.mockRejectedValueOnce(new Error("Email service error"));

      const email = "test@example.com";
      const subject = "Test Subject";
      const html = "<p>This is a test email</p>";

      const result = await notificationService.sendEmail(email, subject, html);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Email service error");
    });
  });

  describe("Group Expiration Notifications", () => {
    test("should send expiration notification when a group expires", async () => {
      const groupId = randomUUID();
      const groupName = "Test Group";
      const expirationTime = new Date(Date.now() + 3600000); // 1 hour from now

      await db.query(
        "INSERT INTO food_orders (id, owner_id, restaurant, expiration) VALUES ($1, $2, $3, $4)",
        [groupId, testUserId, groupName, expirationTime]
      );

      const result = await notificationService.sendExpirationNotification(
        testUserId,
        groupName,
        expirationTime
      );

      expect(result.success).toBe(true);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.stringContaining("user_"),
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
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userEmail,
          subject: expect.stringContaining("joined"),
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
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: userEmail,
          subject: expect.stringContaining("left"),
          html: expect.stringContaining(groupName),
        })
      );
    });
  });
});