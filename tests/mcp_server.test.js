import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleCallTool } from "../mcp_server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Discord Webhook MCP Server Tests", () => {
  let originalFetch;
  let lastFetchUrl = null;
  let lastFetchOptions = null;
  let mockFetchResponse = {
    ok: true,
    status: 204,
    text: async () => "No Content",
  };

  before(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, options) => {
      lastFetchUrl = url;
      lastFetchOptions = options;
      return mockFetchResponse;
    };
  });

  after(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    lastFetchUrl = null;
    lastFetchOptions = null;
    mockFetchResponse = {
      ok: true,
      status: 204,
      text: async () => "No Content",
    };
  });

  describe("Environment Configuration", () => {
    test("should throw an error if DISCORD_WEBHOOK_URL is missing", async () => {
      await assert.rejects(
        handleCallTool("send_message", { message: "Hello" }, {}),
        /DISCORD_WEBHOOK_URL environment variable is not set/
      );
    });
  });

  describe("send_message tool", () => {
    const env = { DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/456" };

    test("should successfully send a simple message", async () => {
      const result = await handleCallTool("send_message", { message: "Hello Discord!" }, env);
      
      assert.deepEqual(result, {
        content: [{ type: "text", text: "Message successfully sent to Discord." }]
      });
      assert.strictEqual(lastFetchUrl, env.DISCORD_WEBHOOK_URL);
      assert.strictEqual(lastFetchOptions.method, "POST");
      assert.strictEqual(lastFetchOptions.headers["Content-Type"], "application/json");

      const body = JSON.parse(lastFetchOptions.body);
      assert.strictEqual(body.content, "Hello Discord!");
      assert.strictEqual(body.username, undefined);
    });

    test("should send a message with custom username and avatar", async () => {
      const args = {
        message: "Hello Discord!",
        username: "CustomBot",
        avatar_url: "https://example.com/avatar.png",
      };
      await handleCallTool("send_message", args, env);
      
      const body = JSON.parse(lastFetchOptions.body);
      assert.strictEqual(body.content, "Hello Discord!");
      assert.strictEqual(body.username, "CustomBot");
      assert.strictEqual(body.avatar_url, "https://example.com/avatar.png");
    });

    test("should fail validation if message is empty", async () => {
      await assert.rejects(
        handleCallTool("send_message", { message: "" }, env),
        /message must be a non-empty string/
      );
    });

    test("should fail validation if avatar_url is invalid", async () => {
      await assert.rejects(
        handleCallTool("send_message", { message: "Hi", avatar_url: "invalid-url" }, env),
        /avatar_url must be a valid URL/
      );
    });

    test("should propagate Discord API failure errors", async () => {
      mockFetchResponse = {
        ok: false,
        status: 400,
        text: async () => "Invalid Webhook Token",
      };

      await assert.rejects(
        handleCallTool("send_message", { message: "Hi" }, env),
        /Discord API responded with status 400: Invalid Webhook Token/
      );
    });
  });

  describe("send_image tool", () => {
    const env = { DISCORD_WEBHOOK_URL: "https://discord.com/api/webhooks/123/456" };
    const tempImgPath = path.join(__dirname, "test_temp.png");

    before(async () => {
      await fs.writeFile(tempImgPath, "dummy image content");
    });

    after(async () => {
      try {
        await fs.unlink(tempImgPath);
      } catch {
        // Ignore if file doesn't exist
      }
    });

    test("should successfully send an image", async () => {
      const result = await handleCallTool("send_image", { image_path: tempImgPath }, env);

      assert.deepEqual(result, {
        content: [{ type: "text", text: "Image successfully sent to Discord." }]
      });
      assert.strictEqual(lastFetchUrl, env.DISCORD_WEBHOOK_URL);
      assert.strictEqual(lastFetchOptions.method, "POST");
      
      // Since it's FormData, body is an instance of FormData
      assert.ok(lastFetchOptions.body instanceof FormData);
      const formData = lastFetchOptions.body;
      assert.ok(formData.has("files[0]"));
      assert.ok(formData.has("payload_json"));

      const payload = JSON.parse(formData.get("payload_json"));
      assert.deepEqual(payload, {});
    });

    test("should successfully send an image with message, username, and avatar", async () => {
      const args = {
        image_path: tempImgPath,
        message: "Check out this image!",
        username: "PhotoBot",
        avatar_url: "https://example.com/photo.png",
      };
      await handleCallTool("send_image", args, env);

      const formData = lastFetchOptions.body;
      const payload = JSON.parse(formData.get("payload_json"));
      assert.strictEqual(payload.content, "Check out this image!");
      assert.strictEqual(payload.username, "PhotoBot");
      assert.strictEqual(payload.avatar_url, "https://example.com/photo.png");
    });

    test("should fail if image file does not exist", async () => {
      const nonExistentPath = path.join(__dirname, "does_not_exist.png");
      await assert.rejects(
        handleCallTool("send_image", { image_path: nonExistentPath }, env),
        /File not found:/
      );
    });

    test("should fail validation if image_path is empty", async () => {
      await assert.rejects(
        handleCallTool("send_image", { image_path: "" }, env),
        /image_path must be a non-empty string/
      );
    });
  });
});
