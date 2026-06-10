#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Zod schemas for validation
export const SendMessageSchema = z.object({
  message: z.string().min(1, "message must be a non-empty string"),
  username: z.string().optional(),
  avatar_url: z.string().url("avatar_url must be a valid URL").optional(),
});

export const SendImageSchema = z.object({
  image_path: z.string().min(1, "image_path must be a non-empty string"),
  message: z.string().optional(),
  username: z.string().optional(),
  avatar_url: z.string().url("avatar_url must be a valid URL").optional(),
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".gif": return "image/gif";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

/**
 * Handles the actual tool call execution.
 * Extracted into a helper function to allow easy unit testing.
 */
async function handleSendMessage(args, webhookUrl) {
  const parsed = SendMessageSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${parsed.error.issues.map(e => e.message).join(", ")}`);
  }

  const { message, username, avatar_url } = parsed.data;
  const payload = { content: message };
  if (username) payload.username = username;
  if (avatar_url) payload.avatar_url = avatar_url;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API responded with status ${response.status}: ${errorText}`);
  }

  return {
    content: [
      {
        type: "text",
        text: `Message successfully sent to Discord.`,
      },
    ],
  };
}

async function handleSendImage(args, webhookUrl) {
  const parsed = SendImageSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${parsed.error.issues.map(e => e.message).join(", ")}`);
  }

  const { image_path, message, username, avatar_url } = parsed.data;

  // Resolve path and check file existence
  const resolvedPath = path.resolve(image_path);
  try {
    await fs.access(resolvedPath);
  } catch {
    throw new Error(`File not found: ${image_path}`);
  }

  const fileBuffer = await fs.readFile(resolvedPath);
  const mimeType = getMimeType(resolvedPath);
  const fileName = path.basename(resolvedPath);

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append("files[0]", blob, fileName);

  const payload = {};
  if (message) payload.content = message;
  if (username) payload.username = username;
  if (avatar_url) payload.avatar_url = avatar_url;

  formData.append("payload_json", JSON.stringify(payload));

  const response = await fetch(webhookUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord API responded with status ${response.status}: ${errorText}`);
  }

  return {
    content: [
      {
        type: "text",
        text: `Image successfully sent to Discord.`,
      },
    ],
  };
}

/**
 * Handles the actual tool call execution.
 * Extracted into a helper function to allow easy unit testing.
 */
export async function handleCallTool(name, args, env = process.env) {
  let webhookUrl = env.DISCORD_WEBHOOK_URL;

  // If environment variable is not set, try command-line arguments
  if (!webhookUrl && typeof process !== "undefined" && process.argv) {
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (arg.startsWith("--url=")) {
        webhookUrl = arg.slice(6);
        break;
      }
      if (arg === "--url" && i + 1 < process.argv.length) {
        webhookUrl = process.argv[i + 1];
        break;
      }
    }
  }

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL environment variable is not set.");
  }

  switch (name) {
    case "send_message":
      return await handleSendMessage(args, webhookUrl);
    case "send_image":
      return await handleSendImage(args, webhookUrl);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const server = new Server(
  {
    name: "discord-webhook",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "send_message",
        description: "Send a message to Discord via webhook",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "The text message to send to Discord.",
            },
            username: {
              type: "string",
              description: "Optional username override for the webhook bot.",
            },
            avatar_url: {
              type: "string",
              description: "Optional avatar image URL override for the webhook bot.",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "send_image",
        description: "Send an image to Discord via webhook",
        inputSchema: {
          type: "object",
          properties: {
            image_path: {
              type: "string",
              description: "The local file path (absolute or relative) to the image to upload.",
            },
            message: {
              type: "string",
              description: "Optional text message to accompany the image.",
            },
            username: {
              type: "string",
              description: "Optional username override for the webhook bot.",
            },
            avatar_url: {
              type: "string",
              description: "Optional avatar image URL override for the webhook bot.",
            },
          },
          required: ["image_path"],
        },
      },
    ],
  };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    return await handleCallTool(name, args);
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: error.message,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Discord Webhook MCP Server running on stdio");
}

let realArgv1 = "";
try {
  realArgv1 = process.argv[1] ? realpathSync(process.argv[1]) : "";
} catch (e) {
  // Ignore errors if the file doesn't exist
}

const isMain =
  realArgv1 === fileURLToPath(import.meta.url) ||
  (process.argv[1] && process.argv[1].endsWith("mcp_server.js"));

if (isMain) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}
