#!/bin/bash

# Universal Multi-Channel Notification Script
# Supports: Slack, Discord, LINE
# Usage: ./notify.sh {success|error|warning|info} "message" ["details"]

set -e

# Configuration
SCRIPT_NAME="GitHub Actions Universal Notifier"
TIMESTAMP=${TIMESTAMP:-$(date -u '+%Y-%m-%d %H:%M:%S UTC')}

# Default values for environment variables
SOURCE_REPOSITORY=${SOURCE_REPOSITORY:-${GITHUB_REPOSITORY:-"Unknown Repository"}}
SOURCE_BRANCH=${SOURCE_BRANCH:-${GITHUB_REF_NAME:-"unknown"}}
GITHUB_ACTOR=${GITHUB_ACTOR:-"GitHub Actions"}
WORKFLOW_URL=${WORKFLOW_URL:-""}
TITLE=${TITLE:-""}
TARGET_INFO=${TARGET_INFO:-""}
DETAILS=${DETAILS:-""}

# Function to send Slack notification
send_slack_notification() {
    local webhook_url="$1"
    local status="$2"
    local message="$3"
    local details="$4"
    
    if [ -z "$webhook_url" ]; then
        echo "⚠️ Slack webhook URL not configured"
        return 0
    fi
    
    # Status-based styling
    local color="#36a64f"  # green
    local emoji=":white_check_mark:"
    
    case "$status" in
        "error")
            color="#ff0000"  # red
            emoji=":x:"
            ;;
        "warning")
            color="#ffaa00"  # orange
            emoji=":warning:"
            ;;
        "info")
            color="#0099ff"  # blue
            emoji=":information_source:"
            ;;
    esac
    
    # Build title
    local title_text="$emoji $message"
    if [ -n "$TITLE" ]; then
        title_text="$emoji $TITLE"
    fi
    
    # Build fields
    local fields='[
        {
            "title": "Repository",
            "value": "'"$SOURCE_REPOSITORY"'",
            "short": true
        },
        {
            "title": "Branch",
            "value": "'"$SOURCE_BRANCH"'",
            "short": true
        }'
    
    if [ -n "$TARGET_INFO" ]; then
        fields+=',{
            "title": "Target",
            "value": "'"$TARGET_INFO"'",
            "short": true
        }'
    fi
    
    fields+=',{
            "title": "Actor",
            "value": "'"$GITHUB_ACTOR"'",
            "short": true
        },
        {
            "title": "Timestamp",
            "value": "'"$TIMESTAMP"'",
            "short": true
        }'
    
    if [ -n "$WORKFLOW_URL" ]; then
        fields+=',{
            "title": "Workflow",
            "value": "<'"$WORKFLOW_URL"'|View Details>",
            "short": true
        }'
    fi
    
    fields+=']'
    
    # Build Slack payload
    local payload=$(cat <<EOF
{
    "username": "GitHub Actions Bot",
    "icon_emoji": ":octocat:",
    "attachments": [
        {
            "color": "$color",
            "title": "$title_text",
            "fields": $fields,
            "text": "$details",
            "footer": "GitHub Actions",
            "footer_icon": "https://github.com/favicon.ico"
        }
    ]
}
EOF
)
    
    local response=$(curl -X POST \
        -H 'Content-type: application/json' \
        -d "$payload" \
        "$webhook_url" \
        --silent --write-out "HTTPSTATUS:%{http_code}")
    
    local http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ Slack notification sent"
    else
        echo "❌ Slack notification failed (HTTP $http_code)"
        return 1
    fi
}

# Function to send Discord notification
send_discord_notification() {
    local webhook_url="$1"
    local status="$2"
    local message="$3"
    local details="$4"
    
    if [ -z "$webhook_url" ]; then
        echo "⚠️ Discord webhook URL not configured"
        return 0
    fi
    
    # Status-based styling
    local color=3066993  # green
    local emoji="✅"
    
    case "$status" in
        "error")
            color=15158332  # red
            emoji="❌"
            ;;
        "warning")
            color=16776960  # orange
            emoji="⚠️"
            ;;
        "info")
            color=3447003   # blue
            emoji="ℹ️"
            ;;
    esac
    
    # Build title
    local title_text="$emoji $message"
    if [ -n "$TITLE" ]; then
        title_text="$emoji $TITLE"
    fi
    
    # Build fields
    local fields='[
        {
            "name": "Repository",
            "value": "'"$SOURCE_REPOSITORY"'",
            "inline": true
        },
        {
            "name": "Branch",
            "value": "'"$SOURCE_BRANCH"'",
            "inline": true
        },
        {
            "name": "Actor",
            "value": "'"$GITHUB_ACTOR"'",
            "inline": true
        }'
    
    if [ -n "$TARGET_INFO" ]; then
        fields+=',{
            "name": "Target",
            "value": "'"$TARGET_INFO"'",
            "inline": true
        }'
    fi
    
    if [ -n "$WORKFLOW_URL" ]; then
        fields+=',{
            "name": "Workflow",
            "value": "[View Details]('"$WORKFLOW_URL"')",
            "inline": true
        }'
    fi
    
    fields+=']'
    
    # Build Discord embed payload
    local payload=$(cat <<EOF
{
    "username": "GitHub Actions Bot",
    "avatar_url": "https://github.com/github.png",
    "embeds": [
        {
            "title": "$title_text",
            "description": "$details",
            "color": $color,
            "fields": $fields,
            "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
            "footer": {
                "text": "GitHub Actions"
            }
        }
    ]
}
EOF
)
    
    local response=$(curl -X POST \
        -H 'Content-type: application/json' \
        -d "$payload" \
        "$webhook_url" \
        --silent --write-out "HTTPSTATUS:%{http_code}")
    
    local http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 204 ]; then
        echo "✅ Discord notification sent"
    else
        echo "❌ Discord notification failed (HTTP $http_code)"
        return 1
    fi
}

# Function to send LINE notification
send_line_notification() {
    local token="$1"
    local status="$2"
    local message="$3"
    local details="$4"
    
    if [ -z "$token" ]; then
        echo "⚠️ LINE Notify token not configured"
        return 0
    fi
    
    # Status-based emoji
    local emoji="✅"
    case "$status" in
        "error") emoji="❌" ;;
        "warning") emoji="⚠️" ;;
        "info") emoji="ℹ️" ;;
    esac
    
    # Build title
    local title_text="$message"
    if [ -n "$TITLE" ]; then
        title_text="$TITLE"
    fi
    
    # Build LINE message
    local line_message="$emoji $title_text

📁 Repository: $SOURCE_REPOSITORY
🌿 Branch: $SOURCE_BRANCH
👤 Actor: $GITHUB_ACTOR"

    if [ -n "$TARGET_INFO" ]; then
        line_message="${line_message}
🎯 Target: $TARGET_INFO"
    fi

    line_message="${line_message}
🕐 Time: $TIMESTAMP"

    if [ -n "$WORKFLOW_URL" ]; then
        line_message="${line_message}
🔗 Workflow: $WORKFLOW_URL"
    fi

    if [ -n "$details" ]; then
        line_message="${line_message}

$details"
    fi
    
    local response=$(curl -X POST \
        -H "Authorization: Bearer $token" \
        -F "message=$line_message" \
        "https://notify-api.line.me/api/notify" \
        --silent --write-out "HTTPSTATUS:%{http_code}")
    
    local http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ LINE notification sent"
    else
        echo "❌ LINE notification failed (HTTP $http_code)"
        return 1
    fi
}

# Main notification function
send_notifications() {
    local status="$1"
    local message="$2" 
    local details="$3"
    
    echo "📢 Sending $status notifications..."
    
    local notification_sent=false
    local errors=0
    
    # Send to all configured channels
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        if send_slack_notification "$SLACK_WEBHOOK_URL" "$status" "$message" "$details"; then
            notification_sent=true
        else
            ((errors++))
        fi
    fi
    
    if [ -n "$DISCORD_WEBHOOK_URL" ]; then
        if send_discord_notification "$DISCORD_WEBHOOK_URL" "$status" "$message" "$details"; then
            notification_sent=true
        else
            ((errors++))
        fi
    fi
    
    if [ -n "$LINE_NOTIFY_TOKEN" ]; then
        if send_line_notification "$LINE_NOTIFY_TOKEN" "$status" "$message" "$details"; then
            notification_sent=true
        else
            ((errors++))
        fi
    fi
    
    if [ "$notification_sent" = false ]; then
        echo "⚠️ No notification channels configured"
        echo "Available channels: SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL, LINE_NOTIFY_TOKEN"
        return 1
    fi
    
    if [ "$errors" -gt 0 ]; then
        echo "⚠️ $errors notification(s) failed"
        return 1
    fi
    
    echo "✅ All notifications sent successfully"
    return 0
}

# Usage examples and direct execution support
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Direct execution - parse command line arguments
    case "${1:-help}" in
        "success"|"error"|"warning"|"info")
            if [ -z "$2" ]; then
                echo "Error: Message is required"
                echo "Usage: $0 {success|error|warning|info} \"message\" [\"details\"]"
                exit 1
            fi
            send_notifications "$1" "$2" "${3:-$DETAILS}"
            ;;
        "test")
            send_notifications "info" "Notification Test" "This is a test message to verify notification channels are working correctly."
            ;;
        "help"|*)
            echo "Usage: $0 {success|error|warning|info} \"message\" [\"details\"]"
            echo ""
            echo "Environment variables:"
            echo "  SLACK_WEBHOOK_URL     - Slack incoming webhook URL"
            echo "  DISCORD_WEBHOOK_URL   - Discord webhook URL"
            echo "  LINE_NOTIFY_TOKEN     - LINE Notify access token"
            echo ""
            echo "  SOURCE_REPOSITORY     - Source repository name (default: \$GITHUB_REPOSITORY)"
            echo "  SOURCE_BRANCH         - Source branch name (default: \$GITHUB_REF_NAME)"
            echo "  GITHUB_ACTOR          - GitHub actor name"
            echo "  WORKFLOW_URL          - GitHub workflow URL"
            echo "  TITLE                 - Custom notification title"
            echo "  TARGET_INFO           - Target information"
            echo "  DETAILS               - Additional details"
            echo "  TIMESTAMP             - Custom timestamp"
            echo ""
            echo "Examples:"
            echo "  $0 success \"Build completed\" \"All tests passed\""
            echo "  $0 error \"Build failed\" \"Check the logs for details\""
            echo "  $0 test"
            ;;
    esac
fi