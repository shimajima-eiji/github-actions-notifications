# Universal Notification System Setup Guide

## 概要

この汎用通知システムは、任意のGitHub Actionsワークフローから **Slack・Discord・LINE** への通知を簡単に実装できます。

## セットアップ手順

### 1. Reusable Workflow ファイルの手動作成

**注意**: 現在GitHub MCPの制約により、以下のファイルを手動で作成してください：

`shimajima-eiji/github-actions-notifications/.github/workflows/notify.yml`

```yaml
name: Universal Notification Workflow

on:
  workflow_call:
    inputs:
      status:
        description: 'Notification status: success, error, warning, or info'
        required: true
        type: string
      title:
        description: 'Notification title'
        required: false
        type: string
        default: ''
      message:
        description: 'Notification message'
        required: true
        type: string
      details:
        description: 'Additional details'
        required: false
        type: string
        default: ''
      repository:
        description: 'Source repository name'
        required: false
        type: string
        default: ''
      branch:
        description: 'Source branch name'
        required: false
        type: string
        default: ''
      target:
        description: 'Target information'
        required: false
        type: string
        default: ''
      workflow_url:
        description: 'GitHub Actions workflow URL'
        required: false
        type: string
        default: ''
    secrets:
      SLACK_WEBHOOK_URL:
        description: 'Slack webhook URL'
        required: false
      DISCORD_WEBHOOK_URL:
        description: 'Discord webhook URL'
        required: false
      LINE_NOTIFY_TOKEN:
        description: 'LINE Notify token'
        required: false

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout notification scripts
        uses: actions/checkout@v4
        with:
          repository: shimajima-eiji/github-actions-notifications
          path: notifications
          
      - name: Make script executable
        run: chmod +x notifications/scripts/notify.sh
        
      - name: Send notifications
        run: |
          # Export all inputs as environment variables
          export STATUS="${{ inputs.status }}"
          export TITLE="${{ inputs.title }}"
          export MESSAGE="${{ inputs.message }}"
          export DETAILS="${{ inputs.details }}"
          export SOURCE_REPOSITORY="${{ inputs.repository || github.repository }}"
          export SOURCE_BRANCH="${{ inputs.branch || github.ref_name }}"
          export TARGET_INFO="${{ inputs.target }}"
          export WORKFLOW_URL="${{ inputs.workflow_url || github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
          export GITHUB_ACTOR="${{ github.actor }}"
          export TIMESTAMP="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
          
          # Call the notification script
          notifications/scripts/notify.sh "$STATUS" "$MESSAGE" "$DETAILS"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
          LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
```

### 2. 通知チャンネルの設定

#### Slack設定

1. **Slack Appを作成**
   - https://api.slack.com/apps にアクセス
   - "Create New App" → "From scratch"
   - App名: `GitHub Actions Notifications`

2. **Incoming Webhookを有効化**
   - "Incoming Webhooks" → "Activate Incoming Webhooks"
   - "Add New Webhook to Workspace"
   - 通知先チャンネルを選択
   - Webhook URLをコピー

#### Discord設定

1. **Discord ServerでWebhook作成**
   - 通知先チャンネルの設定を開く
   - "統合" → "ウェブフック" → "新しいウェブフック"
   - 名前: `GitHub Actions Notifications`
   - Webhook URLをコピー

#### LINE設定

1. **LINE Notifyでトークン取得**
   - https://notify-bot.line.me/ja/ にアクセス
   - "ログイン" → LINEアカウントでログイン
   - "マイページ" → "トークンを発行する"
   - トークン名: `GitHub Actions Notifications`
   - 通知先を選択（個人 or グループ）
   - トークンをコピー

### 3. GitHub Secrets設定

各リポジトリで以下のSecretsを設定：

```
SLACK_WEBHOOK_URL     # Slack Webhook URL
DISCORD_WEBHOOK_URL   # Discord Webhook URL  
LINE_NOTIFY_TOKEN     # LINE Notify Token
```

設定場所: `Repository Settings > Secrets and variables > Actions > New repository secret`

## 使用方法

### 基本的な成功通知

```yaml
jobs:
  my-job:
    runs-on: ubuntu-latest
    steps:
      # ... your build steps ...
      
  notify:
    needs: my-job
    if: always()
    uses: shimajima-eiji/github-actions-notifications/.github/workflows/notify.yml@main
    with:
      status: ${{ needs.my-job.result == 'success' && 'success' || 'error' }}
      message: ${{ needs.my-job.result == 'success' && 'Build completed successfully' || 'Build failed' }}
      details: ${{ needs.my-job.result == 'success' && 'All tests passed' || 'Check the logs for errors' }}
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
      LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
```

### 詳細情報付きの通知

```yaml
  notify-detailed:
    uses: shimajima-eiji/github-actions-notifications/.github/workflows/notify.yml@main
    with:
      status: "success"
      title: "Production Deployment"
      message: "Application deployed successfully"
      details: |
        Version: v1.2.3
        Environment: Production
        Build time: 2m 34s
        Tests: All passed
      target: "production.example.com"
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
      LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
```

### 条件付き通知

```yaml
  # エラー時のみ通知
  notify-error-only:
    needs: build
    if: needs.build.result == 'failure'
    uses: shimajima-eiji/github-actions-notifications/.github/workflows/notify.yml@main
    with:
      status: "error"
      message: "Build failed on ${{ github.ref_name }}"
      details: "Please check the logs and fix the issues."
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## テスト方法

### 1. 設定テスト

新しいリポジトリでテスト用ワークフローを作成：

```yaml
name: Test Notifications
on:
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Test type'
        required: true
        type: choice
        options: ['success', 'error', 'warning', 'info']
      message:
        description: 'Test message'
        required: true
        default: 'This is a test notification'

jobs:
  test-notify:
    uses: shimajima-eiji/github-actions-notifications/.github/workflows/notify.yml@main
    with:
      status: ${{ inputs.test_type }}
      message: ${{ inputs.message }}
      details: "Testing notification system functionality"
    secrets:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
      LINE_NOTIFY_TOKEN: ${{ secrets.LINE_NOTIFY_TOKEN }}
```

### 2. 実行テスト

1. 上記のワークフローを追加
2. GitHub Actions > "Test Notifications" > "Run workflow"
3. 各チャンネルに通知が届くことを確認

## トラブルシューティング

### よくある問題

1. **通知が届かない**
   - Secrets設定を確認
   - Webhook URL/トークンが正しいか確認
   - チャンネルが存在するか確認

2. **一部のチャンネルのみ動作**
   - 各サービスのSecrets設定を個別に確認
   - ログでエラーメッセージを確認

3. **Reusable Workflowが見つからない**
   - ファイルパスが正しいか確認: `.github/workflows/notify.yml`
   - リポジトリがpublicか確認
   - ブランチ名が正しいか確認 (`@main`)

### デバッグ方法

通知システムのログを確認：
1. GitHub Actions > ワークフロー実行
2. "notify" job を展開
3. "Send notifications" ステップのログを確認

## 活用例

### CI/CDパイプライン
- ビルド成功/失敗通知
- デプロイ完了通知
- テスト結果通知

### 監視・アラート
- セキュリティスキャン結果
- 依存関係更新通知
- リソース使用量アラート

### プロジェクト管理
- リリース通知
- プルリクエスト状況
- コードレビュー依頼

これで、あらゆるプロジェクトで統一された通知システムを利用できます！