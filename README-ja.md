# discord-webhook-mcp

これは、Discordのウェブフックを利用して、AIエージェントからDiscordに通知を送信するMCPサーバーです。

## WebHookのURLの取得方法

DiscordのWebhook URLを取得する手順です。

* Discordで対象の**サーバー**を開く
* Webhookを送信したい**テキストチャンネル**を選ぶ
* チャンネル名の右側にある歯車アイコン、または右クリックから**「チャンネルの編集」**を開く
* 左メニューから**「連携サービス」**を開く
* **「Webhook」**を開く
* **「新しいWebhook」**または**「Webhookを作成」**を押す
* Webhookの名前を設定する
* 投稿先チャンネルが正しいか確認する
* 必要ならアイコン画像も設定する
* **「Webhook URLをコピー」**を押す
* **「変更を保存」**を押す

注意点として、**Webhook URLは秘密情報**なので公開しないでください。

## AIエージェントへのインストール

次の手順でAIエージェントにインストールします。

### Install to Codex CLI

```sh
codex mcp add discord-webhook \
    npx -y @kujirahand/discord-webhook-mcp \
    --env DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

### Install to Claude Code

```sh
claude mcp add discord-webhook \
    @kujirahand/discord-webhook-mcp \
    --env DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxx
```

### Install to Antigravity CLI

Please write following configuration file `~/.gemini/config/mcp_config.json`

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


