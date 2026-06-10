# ゴール

DiscordのWebhookを実行するMCPサーバーを作成します。

## 利用技術

Node.jsを利用します。
stdio経由で動作するものにします。

### 利用ライブラリ

```sh
npm install \
    @modelcontextprotocol/sdk \
    zod@4
```

## ツール

### send_message

DisciordにWebhookでメッセージを送信します。

### send_image

DiscordにWebhookで画像を送信します。

## テスト

`tests/*.js`にテストを作ってください。
Node.js標準のテストフレームワークを使ってください。

## 作成スクリプト

- `mcp_server.js`

