# discord-webhook-mcp

MCP Server for Discord webhook

## Install to Antigravity CLI

```sh
gemini mcp add discord-webhook \
    node mcp_server.js \
    --env DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

## Install to Codex CLI

```sh
codex mcp add discord-webhook \
    node mcp_server.js \
    --env DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

## Install to Claude Code

```sh
claude mcp add discord-webhook \
    node mcp_server.js \
    --env DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

## Available Tools

### 1. `send_message`
Sends a text message to the Discord channel.
- **Arguments:**
  - `message` (string, required): The text message.
  - `username` (string, optional): Override the webhook bot's username.
  - `avatar_url` (string, optional): Override the webhook bot's avatar.

### 2. `send_image`
Uploads an image file to the Discord channel.
- **Arguments:**
  - `image_path` (string, required): Local path to the image file.
  - `message` (string, optional): Accompanying text message.
  - `username` (string, optional): Override the webhook bot's username.
  - `avatar_url` (string, optional): Override the webhook bot's avatar.


