# Deployment Guide - AI Notification System v2.0

## 🚀 Vercel Deployment

### Prerequisites

- Vercel account
- Node.js 18+ (for local development)
- GitHub repository access

### Step 1: Vercel Setup

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from repository root
   vercel
   ```

2. **Configure Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   
   ```bash
   # Required
   JWT_SECRET=your-super-secret-key-change-this
   
   # Notification Channels (at least one required)
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   LINE_NOTIFY_TOKEN=your-line-notify-token
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
   
   # Optional
   LOG_LEVEL=info
   API_KEYS=org1:key1,org2:key2
   NODE_ENV=production
   ```

### Step 2: Generate Authentication Tokens

```bash
# Install dependencies locally
npm install

# Generate tokens for your organizations
node cli/setup.js generate-token shimajima-eiji ci-system
node cli/setup.js generate-token nomuraya-dojo ci-system

# Test configuration
node cli/setup.js test-config
```

### Step 3: Verify Deployment

```bash
# Check system health
curl https://your-app.vercel.app/api/health

# Test notification (replace with your token)
curl -X POST https://your-app.vercel.app/api/notify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "info",
    "message": "Deployment test",
    "repository": "test-repo",
    "branch": "main"
  }'
```

## 🔧 Configuration Details

### Notification Channel Setup

#### Slack
1. Go to https://api.slack.com/apps
2. Create new app → "From scratch"
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy webhook URL to `SLACK_WEBHOOK_URL`

#### Discord
1. Go to your Discord server
2. Channel Settings → Integrations → Webhooks
3. Create new webhook
4. Copy webhook URL to `DISCORD_WEBHOOK_URL`

#### LINE
1. Go to https://notify-bot.line.me/
2. Login with LINE account
3. Generate token for your group/personal chat
4. Copy token to `LINE_NOTIFY_TOKEN`

### Security Configuration

```json
{
  "security": {
    "allowedOrgs": [
      "shimajima-eiji",
      "nomuraya-dojo",
      "nomuraya-hostings"
    ],
    "rateLimit": {
      "maxRequestsPerMinute": 60
    }
  }
}
```

## 🔄 CI/CD Integration

### GitHub Actions Setup

1. **Add Repository Secrets**
   ```
   NOTIFICATION_TOKEN=<your-jwt-token>
   NOTIFICATION_URL=https://your-app.vercel.app/api/notify
   ```

2. **Update Workflow Files**
   ```yaml
   - name: Send Notification
     uses: shimajima-eiji/github-actions-notifications@main
     with:
       status: 'success'
       message: 'Build completed successfully'
       token: ${{ secrets.NOTIFICATION_TOKEN }}
       notification_url: ${{ secrets.NOTIFICATION_URL }}
   ```

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl https://your-app.vercel.app/api/health

# Authenticated health check (more details)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-app.vercel.app/api/health
```

### Log Monitoring

- **Vercel Dashboard**: Real-time function logs
- **Vercel CLI**: `vercel logs your-app.vercel.app`
- **Application Logs**: Built-in structured logging

### Performance Metrics

- Response time: < 3 seconds target
- Error rate: < 5% target
- Uptime: 99.9% target (Vercel SLA)

## 🛠️ Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check JWT_SECRET environment variable
   - Regenerate tokens with `node cli/setup.js generate-token`
   - Verify token format: `Bearer <token>`

2. **Notifications not sending**
   - Check webhook URLs in environment variables
   - Test individual channels with health endpoint
   - Verify channel configurations in config/default.json

3. **500 Internal Server Error**
   - Check Vercel function logs
   - Verify all required environment variables are set
   - Test locally with `vercel dev`

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug vercel env add LOG_LEVEL

# Test locally
vercel dev
```

## 🔄 Updates & Maintenance

### Updating the System

1. **Code Updates**
   ```bash
   git pull origin main
   vercel --prod
   ```

2. **Configuration Updates**
   - Update `config/default.json`
   - Redeploy: `vercel --prod`

3. **Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Or via CLI: `vercel env add VARIABLE_NAME`

### GitHub Copilot Maintenance

利用可能なプロンプト例：

```
// 新しい通知チャネル追加
"lib/notification-router.jsにMicrosoft Teams通知機能を追加して"

// エラーハンドリング改善  
"api/notify.jsのエラーハンドリングをより詳細にして"

// 設定オプション追加
"config/default.jsonに新しい設定オプションを追加して対応するコードも更新"
```

## 📊 Performance Optimization

### Recommended Settings

```json
{
  "functions": {
    "api/notify.js": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/health",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Scaling Considerations

- **Concurrent Requests**: Vercel handles automatically
- **Rate Limiting**: Configured per organization
- **Webhook Timeouts**: 30s max per notification
- **Memory Usage**: Minimal (~50MB per function)

---

**🎯 Ready for Production!**

このガイドに従って、安定した運用が可能なAI通知システムを構築できます。GitHub Copilotを活用した継続的なメンテナンスにより、システムを長期間効率的に運用できます。