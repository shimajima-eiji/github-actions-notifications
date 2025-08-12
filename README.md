# 🚀 AI Notification System v2.0

**シンプル・実用重視**の GitHub Actions 通知システム

[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## ⚡ クイックスタート

**5分で通知システムを使い始める**

[![Quick Start](https://img.shields.io/badge/📖_Quick_Start-5分で開始-brightgreen)](QUICKSTART.md)

**👆 まずはこちらから始めてください！**

---

## 🎯 特徴

- **🌐 クロスオーガニゼーション対応**: トークンベース認証で任意のorgから利用可能
- **⚡ 高速レスポンス**: ~30秒 → ~3秒（90%改善）
- **🤖 GitHub Copilot最適化**: シンプル設計でメンテナンス性向上
- **📱 マルチチャンネル**: Slack・Discord・LINE・Teams対応
- **⚙️ 設定ファイルベース**: JSON設定で柔軟なカスタマイズ

## 🚀 基本的な使い方

### GitHub Actions で使用

```yaml
- name: Send Notification
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: 'Build completed successfully! 🎉'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### よく使うパターン

```yaml
# ✅ 成功通知のみ
- name: Success Notification
  if: success()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: 'デプロイ完了！'
    token: ${{ secrets.NOTIFICATION_TOKEN }}

# ❌ エラー通知のみ  
- name: Error Notification
  if: failure()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'error'
    message: 'ビルドエラーが発生'
    details: 'ログを確認: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

## 📋 パラメータ一覧

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

📝 詳細情報がここに表示されます
```

## 🛠️ 高度な設定

### 自分専用の通知チャンネル設定

詳細は [デプロイガイド](docs/DEPLOYMENT.md) を参照してください。

- **Slack**: Webhook URL設定で通知先をカスタマイズ
- **Discord**: サーバーのWebhook設定
- **LINE**: LINE Notifyトークン取得
- **Teams**: Incoming Webhook設定

### CLI ツール

```bash
# トークン生成
node cli/setup.js generate-token myorg developer

# 設定検証
node cli/setup.js test-config

# ヘルプ
node cli/setup.js help
```

## 🔍 システム状態確認

```bash
# ヘルスチェック
curl https://your-app.vercel.app/api/health

# 認証付きヘルスチェック（詳細情報）
curl -H \"Authorization: Bearer YOUR_TOKEN\" \\
     https://your-app.vercel.app/api/health
```

## 📚 詳細ドキュメント

### 📖 ガイド
- [⚡ クイックスタート](QUICKSTART.md) - **まずはここから**
- [📖 デプロイガイド](docs/DEPLOYMENT.md) - 詳細なセットアップ手順
- [🔄 移行ガイド](docs/MIGRATION.md) - v1.x からの移行方法

### 💡 使用例とパターン
- [💡 基本使用例](examples/basic-usage.yml) - コピペで使える例
- [🔧 統合パターン](examples/integration-patterns.yml) - 高度な使い方

### 📝 技術情報
- [📝 変更履歴](CHANGELOG.md) - バージョン変更履歴
- [🧪 テストガイド](test/) - テスト実行方法

## 📈 v1.x からの改善点

| 項目 | v1.x | v2.0 |
|------|------|------|
| **応答速度** | ~30秒 | ~3秒 |
| **認証方式** | リポジトリベース | トークンベース |
| **組織間利用** | 制限あり | 制限なし |
| **メンテナンス** | 手動更新必要 | Copilot活用可能 |
| **拡張性** | Workflow修正必要 | 簡単に機能追加 |

## 🚨 よくある問題

### 401 Unauthorized エラー
```bash
# トークン再生成
node cli/setup.js generate-token your-org ci-system
# GitHub Secrets を更新
```

### 通知が届かない
- [クイックスタートガイド](QUICKSTART.md) の設定を確認
- [ヘルスチェック](#システム状態確認) でシステム状態を確認
- GitHub Actionsのログでエラーメッセージを確認

## 🤝 コントリビューション

プルリクエスト・Issue報告を歓迎します！

GitHub Copilot を活用した効率的な開発アプローチを採用しているため、新機能追加やバグ修正もスムーズに行えます。

### GitHub Copilot活用例

```
// 新機能追加
\"lib/notification-router.js に Microsoft Teams の通知機能を追加して\"

// エラーハンドリング改善
\"api/notify.js のエラーハンドリングをより詳細にして\"
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) をご覧ください。

---

## 🚀 今すぐ始めよう！

[![Quick Start](https://img.shields.io/badge/📖_5分でスタート-QUICKSTART.md-brightgreen?style=for-the-badge)](QUICKSTART.md)

**シンプルで実用的な通知システムを、今すぐあなたのプロジェクトで活用しましょう！**