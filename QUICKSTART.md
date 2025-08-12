# 🚀 Quick Start Guide

**5分でAI通知システムを使い始める**

## ⚡ 超速セットアップ

### Step 1: トークン取得（1分）

```bash
# このリポジトリをクローン
git clone https://github.com/shimajima-eiji/github-actions-notifications
cd github-actions-notifications

# 依存関係インストール
npm install

# あなたの組織用トークンを生成
node cli/setup.js generate-token YOUR_ORG_NAME ci-system

# 出力をコピー 👇
# NOTIFICATION_TOKEN=eyJhbGciOiJIUzI1NiIs...
```

### Step 2: GitHub Secretsに設定（30秒）

あなたのリポジトリで：
1. `Settings` > `Secrets and variables` > `Actions`
2. `New repository secret`をクリック
3. **Name**: `NOTIFICATION_TOKEN`
4. **Secret**: 上記で生成されたトークン
5. `Add secret`をクリック

### Step 3: ワークフローに追加（1分）

`.github/workflows/notify.yml` を作成：

```yaml
name: Quick Notification Test
on: [push]

jobs:
  test-notification:
    runs-on: ubuntu-latest
    steps:
      - name: Send test notification
        uses: shimajima-eiji/github-actions-notifications@main
        with:
          status: 'success'
          message: '🎉 AI通知システムが動作しています！'
          details: |
            ✅ セットアップ完了
            📅 $(date)
            🔗 リポジトリ: ${{ github.repository }}
          token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### Step 4: 動作確認（30秒）

1. ファイルをコミット&プッシュ
2. GitHub Actionsタブで実行確認
3. 通知が届けばセットアップ完了！🎉

---

## 📱 通知チャンネル設定（オプション）

### 📺 デフォルト通知先
- **現在**: システムのデフォルト通知チャンネル
- **カスタマイズ**: 下記手順で自分のチャンネルを追加可能

### 🔧 自分のチャンネル追加

#### Slack設定（2分）
```bash
# 1. https://api.slack.com/apps でアプリ作成
# 2. Incoming Webhooks 有効化
# 3. Webhook URL取得

# 4. プロジェクトのVercelアプリに設定
# （または管理者に依頼）
```

#### Discord設定（1分）
```bash
# 1. サーバー設定 > 連携 > Webhook作成
# 2. URL取得して上記同様に設定
```

---

## 🎯 よく使うパターン

### ✅ 成功通知のみ
```yaml
- name: Success only
  if: success()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: 'デプロイ完了！'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### ❌ エラー通知のみ
```yaml
- name: Error only  
  if: failure()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'error'
    message: 'ビルドエラーが発生しました'
    details: 'ログを確認してください: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

### 🎯 条件付き通知
```yaml
# mainブランチのみ
- name: Production deployment
  if: github.ref == 'refs/heads/main' && success()
  uses: shimajima-eiji/github-actions-notifications@main
  with:
    status: 'success'
    message: '🚀 本番デプロイ完了'
    token: ${{ secrets.NOTIFICATION_TOKEN }}
```

---

## ❓ トラブルシューティング

### 🚨 「401 Unauthorized」エラー
```bash
# トークンを再生成
node cli/setup.js generate-token YOUR_ORG_NAME ci-system

# GitHub Secretsを更新
```

### 📭 通知が届かない
- デフォルト通知チャンネルを確認
- トークンが正しく設定されているか確認
- GitHub Actionsのログでエラーを確認

### 💬 サポート
- [Issues](https://github.com/shimajima-eiji/github-actions-notifications/issues)で質問
- [詳細ドキュメント](README.md)を参照

---

## 🚀 今すぐ始めよう！

**5分後にはあなたのプロジェクトでも通知システムが動いています！**

[⬆️ Step 1に戻る](#step-1-トークン取得1分)