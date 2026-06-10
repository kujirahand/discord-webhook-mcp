# discord-webhook-mcp

An MCP server to send notifications from AI agents to Discord via Discord webhooks.

- [日本語のマニュアル](https://github.com/kujirahand/discord-webhook-mcp/blob/main/README-ja.md)

## How to Get Discord Webhook URL

Here are the steps to obtain a Discord Webhook URL:

* Open the target **server** in Discord.
* Choose the **text channel** where you want to send webhooks.
* Click the gear icon next to the channel name, or right-click the channel, to open **"Edit Channel"**.
* Select **"Integrations"** from the left menu.
* Open **"Webhooks"**.
* Click **"New Webhook"** or **"Create Webhook"**.
* Set a name for the Webhook.
* Verify that the posting channel is correct.
* Set an icon image if necessary.
* Click **"Copy Webhook URL"**.
* Click **"Save Changes"**.

> [!WARNING]
> Webhook URLs are sensitive secrets. Do not publish them or make them publicly accessible.

## Setup

You can configure the Discord Webhook URL in one of two ways:
1. Set the `DISCORD_WEBHOOK_URL` environment variable.
2. Pass it as a command-line argument using `--url=YOUR_WEBHOOK_URL` (or `--url YOUR_WEBHOOK_URL`).

## AI Agent Installation

Use the following steps to install the server to your AI agent of choice.

### Install to Codex CLI

```sh
codex mcp add discord-webhook \
    -- npx -y @kujirahand/discord-webhook-mcp \
    --url=https://discord.com/api/webhooks/xxxxx
```

### Install to Claude Code

```sh
claude mcp add discord-webhook \
    -- npx -y @kujirahand/discord-webhook-mcp \
    --url=https://discord.com/api/webhooks/xxxxx
```

### Install to Antigravity CLI

Add the following configuration to your `~/.gemini/config/mcp_config.json` file:

```json
{
  "mcpServers": {
    "discord-webhook": {
      "command": "npx",
      "args": ["-y", "@kujirahand/discord-webhook-mcp"],
      "env": {
        "DISCORD_WEBHOOK_URL": "https://discord.com/api/webhooks/xxxxx"
      }
    }
  }
}
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

