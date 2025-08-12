# GitHub Actions Universal Notifications

汎用的な通知システムで、GitHub Actionsから **Slack・Discord・LINE** への通知を簡単に実装できます。

## 🎯 特徴

- **マルチプラットフォーム**: Slack・Discord・LINE に対応
- **Reusable Workflow**: 他のリポジトリから簡単に呼び出し可能
- **カスタマイズ可能**: メッセージ・色・フォーマットを自由に設定
- **エラーハンドリング**: 通知失敗時も処理を継続

## 🚀 使用方法

### 基本的な使用例

```yaml
name: My Workflow
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Some build step
        run: echo "Building..."
        
      # 成功通知
      - name: Notify success
        if: success()
        uses: your-username/github-actions-notifications/.github/workflows/notify.yml@main
        with:
          status: "success"
          message: "Build completed successfully"
          details: "All tests passed and deployment is ready"
        secrets:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
          
      # エラー通知
      - name: Notify error
        if: failure()
        uses: your-username/github-actions-notifications/.github/workflows/notify.yml@main
        with:
          status: "error"
          message: "Build failed"
          details: "Check the logs for more details"
        secrets:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 高度な使用例

```yaml
      - name: Notify with full context
        uses: your-username/github-actions-notifications/.github/workflows/notify.yml@main
        with:
          status: "success"
          title: "Deployment Complete"
          message: "Application deployed to production"
          details: "Version 1.2.3 is now live"
          repository: ${{ github.repository }}
          branch: ${{ github.ref_name }}
          target: "production environment"
          workflow_url: "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
        secrets:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
```

## 📋 パラメータ

### Inputs

| パラメータ | 必須 | 説明 | デフォルト値 |
|-----------|------|------|-------------|
| `status` | ✅ | 通知ステータス: `success`, `error`, `warning`, `info` | - |
| `message` | ✅ | メインメッセージ | - |
| `title` | ❌ | 通知タイトル | (空文字) |
| `details` | ❌ | 詳細情報 | (空文字) |
| `repository` | ❌ | ソースリポジトリ名 | `github.repository` |
| `branch` | ❌ | ソースブランチ名 | `github.ref_name` |
| `target` | ❌ | ターゲット情報 | (空文字) |
| `workflow_url` | ❌ | ワークフローURL | 自動生成 |

### Secrets

| シークレット | 必須 | 説明 |
|-------------|------|------|
| `SLACK_WEBHOOK_URL` | ❌ | Slack Incoming Webhook URL |
| `DISCORD_WEBHOOK_URL` | ❌ | Discord Webhook URL |
| `LINE_NOTIFY_TOKEN` | ❌ | LINE Notify アクセストークン |

※ 少なくとも1つの通知チャンネルを設定してください

## ⚙️ セットアップ

詳細なセットアップ手順は [Setup Guide](docs/setup-guide.md) をご覧ください。

### クイックセットアップ

1. **Secrets設定**: 各通知サービスのWebhook URL/トークンを設定
2. **Workflow追加**: 上記の使用例を参考にワークフローに追加
3. **テスト実行**: プッシュして通知が正常に動作することを確認

## 🎨 通知例

### Slack
```
✅ Build completed successfully

📁 Repository: user/my-project
🌿 Branch: main
🎯 Target: production environment
🕐 Time: 2025-08-12 13:00:00 UTC
👤 Actor: github-user

All tests passed and deployment is ready
```

### Discord
カラフルなEmbed形式で同様の情報を表示

### LINE
シンプルなテキスト形式で同様の情報を表示

## 🔧 カスタマイズ

このシステムは完全にオープンソースです。フォークして独自の通知チャンネルを追加したり、メッセージフォーマットをカスタマイズできます。

## 📚 関連ドキュメント

- [セットアップガイド](docs/setup-guide.md)
- [カスタマイズガイド](docs/customization.md)
- [トラブルシューティング](docs/troubleshooting.md)

## 🤝 コントリビューション

プルリクエスト・Issue報告を歓迎します！

## 📄 ライセンス

MIT License