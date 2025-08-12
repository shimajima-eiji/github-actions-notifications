# 🚀 AI Notification System v2.0

**シンプル・実用重視**の GitHub Actions 通知システム

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## 🎯 特徴

- **🌐 クロスオーガニゼーション対応**: トークンベース認証で任意のorgから利用可能
- **⚡ 高速レスポンス**: ~30秒 → ~3秒（90%改善）
- **🤖 GitHub Copilot最適化**: シンプル設計でメンテナンス性向上
- **📱 マルチチャンネル**: Slack・Discord・LINE・Teams対応
- **⚙️ 設定ファイルベース**: JSON設定で柔軟なカスタマイズ

## 🚀 クイックスタート

### 1. Vercel デプロイ

```bash
# リポジトリクローン
git clone https://github.com/shimajima-eiji/github-actions-notifications
cd github-actions-notifications

# 依存関係インストール
npm install

# Vercel デプロイ
npm install -g vercel
vercel login
vercel --prod
```

### 2. 環境変数設定

Vercel Dashboard > Settings > Environment Variables で設定：

```bash
# 必須
JWT_SECRET=your-super-secret-key-change-this

# 通知チャンネル（最低1つ必要）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
LINE_NOTIFY_TOKEN=your-line-notify-token
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...

# オプション
LOG_LEVEL=info
```

### 3. 認証トークン生成

```bash
# 組織用トークン生成
node cli/setup.js generate-token your-org ci-system

# 出力例
# Token: eyJhbGciOiJIUzI1NiIs...
# Add this to your GitHub repository secrets:
# NOTIFICATION_TOKEN=eyJhbGciOiJIUzI1NiIs...
```

### 4. GitHub Actions で使用

```yaml
name: Build and Deploy
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: npm run build
        
      # ✅ 成功通知
      - name: Success Notification
        if: success()
        uses: shimajima-eiji/github-actions-notifications@main
        with:
          status: 'success'
          message: 'Build completed successfully! 🎉'
          details: |
            ✅ **Build Summary**
            - Duration: 2m 34s
            - Size: 2.1MB
            - Tests: All passed
          token: ${{ secrets.NOTIFICATION_TOKEN }}
          
      # ❌ 失敗通知
      - name: Failure Notification
        if: failure()
        uses: shimajima-eiji/github-actions-notifications@main
        with:
          status: 'error'
          message: 'Build failed'
          details: 'Check logs for detailed error information'
          token: ${{ secrets.NOTIFICATION_TOKEN }}
```

## 📋 通知チャンネル設定

### Slack
1. https://api.slack.com/apps でアプリ作成
2. Incoming Webhooks 有効化
3. Webhook URL を `SLACK_WEBHOOK_URL` に設定

### Discord
1. Discord サーバー設定 > 連携 > Webhook
2. 新しいWebhook作成
3. URL を `DISCORD_WEBHOOK_URL` に設定

### LINE
1. https://notify-bot.line.me/ でトークン取得
2. 通知先を選択してトークン生成
3. トークンを `LINE_NOTIFY_TOKEN` に設定

### Teams
1. Teams チャンネル > コネクタ > Incoming Webhook
2. Webhook作成
3. URL を `TEAMS_WEBHOOK_URL` に設定

## 🎨 使用例

### 基本的な通知
```yaml
- uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: 'Deployment completed'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### 詳細な通知
```yaml
- uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    title: '🚀 Production Deployment'
    message: 'Application deployed successfully'
    details: |
      🌍 **Live Now!**
      - URL: https://myapp.com
      - Version: v${{ github.run_number }}
      - Health Check: https://myapp.com/health
    target: 'https://myapp.com'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### 条件付き通知
```yaml
# Production のみ通知
- name: Production Notification
  if: github.ref == 'refs/heads/main' && success()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: 'Production deployment completed'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

## 🔧 パラメータ一覧

| パラメータ | 必須 | 説明 | 例 |
|-----------|------|------|---|
| `status` | ✅ | 通知ステータス | `success`, `error`, `warning`, `info` |
| `message` | ✅ | メインメッセージ | `Build completed successfully` |
| `title` | ❌ | 通知タイトル | `🚀 Deployment Complete` |
| `details` | ❌ | 詳細情報 | `Duration: 2m 34s\\nSize: 2.1MB` |
| `target` | ❌ | ターゲット情報 | `production`, `https://myapp.com` |
| `token` | ✅ | 認証トークン | `${{ secrets.NOTIFICATION_TOKEN }}` |
| `notification_url` | ❌ | システムURL | デフォルト値あり |

## 📊 通知例

### Slack での表示
```
✅ Build completed successfully! 🎉

📁 Repository: shimajima-eiji/my-project
🌿 Branch: main
🎯 Target: production
🕐 Time: 2025-08-12 13:45:00 UTC
👤 Actor: shimajima-eiji

✅ **Build Summary**
- Duration: 2m 34s
- Size: 2.1MB
- Tests: All passed
```

### Discord での表示
カラフルなEmbed形式で同様の情報を表示

### LINE での表示
シンプルなテキスト形式で同様の情報を表示

## 🛠️ CLI ツール

```bash
# トークン生成
node cli/setup.js generate-token myorg developer

# API キー生成
node cli/setup.js generate-apikey myorg

# 設定検証
node cli/setup.js test-config

# ヘルプ
node cli/setup.js help
```

## 🔍 ヘルスチェック

```bash
# 基本ヘルスチェック
curl https://your-app.vercel.app/api/health

# 認証付きヘルスチェック（詳細情報）
curl -H \"Authorization: Bearer YOUR_TOKEN\" \\
     https://your-app.vercel.app/api/health
```

## ⚙️ カスタマイズ

### 設定ファイル編集
```json
{
  \"notifications\": {
    \"deduplication\": {
      \"enabled\": true,
      \"windowMinutes\": 30
    },
    \"channels\": {
      \"slack\": { \"enabled\": true, \"priority\": 1 },
      \"discord\": { \"enabled\": true, \"priority\": 2 }
    }
  }
}
```

### GitHub Copilot活用例

新機能の追加や改善は GitHub Copilot で効率的に実装できます：

```
// 新しい通知チャンネル追加
\"lib/notification-router.js に Microsoft Teams の通知機能を追加して\"

// エラーハンドリング改善
\"api/notify.js のエラーハンドリングをより詳細にして\"

// 設定オプション拡張
\"config/default.json に新しい設定オプションを追加して対応するコードも更新\"
```

## 🚨 トラブルシューティング

### よくある問題

1. **401 Unauthorized**
   ```bash
   # トークン再生成
   node cli/setup.js generate-token your-org ci-system
   # GitHub Secrets を更新
   ```

2. **通知が届かない**
   ```bash
   # ヘルスチェックで確認
   curl https://your-app.vercel.app/api/health
   # 環境変数を確認
   ```

3. **設定変更が反映されない**
   ```bash
   # 再デプロイ
   vercel --prod
   ```

## 📚 ドキュメント

- [📖 デプロイガイド](docs/DEPLOYMENT.md) - 詳細なデプロイ手順
- [🔄 移行ガイド](docs/MIGRATION.md) - v1.x からの移行方法
- [💡 使用例](examples/) - より多くの実装例
- [📝 変更履歴](CHANGELOG.md) - バージョン変更履歴

## 📈 v1.x からの改善点

| 項目 | v1.x | v2.0 |
|------|------|------|
| **応答速度** | ~30秒 | ~3秒 |
| **認証方式** | リポジトリベース | トークンベース |
| **組織間利用** | 制限あり | 制限なし |
| **メンテナンス** | 手動更新必要 | Copilot活用可能 |
| **拡張性** | Workflow修正必要 | 簡単に機能追加 |

## 🤝 コントリビューション

プルリクエスト・Issue報告を歓迎します！

GitHub Copilot を活用した効率的な開発アプローチを採用しているため、新機能追加やバグ修正もスムーズに行えます。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🚀 今すぐ始めよう！

1. ⭐ このリポジトリにスターを付ける
2. 🍴 フォークして自分の環境にデプロイ  
3. 🔧 必要に応じてカスタマイズ
4. 🎉 GitHub Actions で通知システムを活用！

**シンプルで実用的な通知システムを、GitHub Copilot と共に進化させていきましょう！**