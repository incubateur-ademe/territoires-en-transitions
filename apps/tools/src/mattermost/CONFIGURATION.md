# Configuration Guide

## Environment Variables

Add these environment variables to your `.env` file or deployment configuration:

### Mattermost Configuration

```bash
# Mattermost webhook URL for bot commands
MATTERMOST_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/your-webhook-id

# Mattermost webhook URL for notifications (optional)
MATTERMOST_NOTIFICATIONS_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/notifications-webhook-id
```

### GitHub Configuration

```bash
# GitHub Personal Access Token with repo and workflow permissions
GITHUB_TOKEN=ghp_your_github_personal_access_token_here

# GitHub repository owner (organization or username)
GITHUB_OWNER=your-organization-or-username

# GitHub repository name
GITHUB_REPO=your-repository-name
```

## GitHub Token Setup

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` - Full control of private repositories
   - `workflow` - Update GitHub Action workflows
3. Copy the token and add it to your environment variables

## Mattermost Setup

### Slash Command

1. Go to **System Console** → **Integrations** → **Slash Commands**
2. Click **Add Slash Command**
3. Configure:
   - **Title**: `Bot Commands`
   - **Command**: `/bot`
   - **Request URL**: `https://your-tools-api.com/mattermost/command`
   - **Response Username**: `MattermostBot`
   - **Response Icon**: Choose an appropriate icon
   - **Description**: `Bot commands for development operations`

### Incoming Webhook (Optional)

1. Go to **System Console** → **Integrations** → **Incoming Webhooks**
2. Click **Add Incoming Webhook**
3. Configure the channel and permissions as needed
