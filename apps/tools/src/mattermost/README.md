# Mattermost Bot Integration

This module provides a Mattermost bot that can trigger GitHub Actions for common development tasks like creating tags and deploying versions.

## Features

- **Tag Management**: Create tags for specific branches via chat commands
- **Deployment Control**: Deploy specific versions to staging or production environments
- **GitHub Integration**: Automatically triggers GitHub Actions workflows
- **Audit Trail**: All operations are logged with user attribution

## Commands

### Tag Creation
```
@bot tag main to v2.0.0
```
Creates a new tag `v2.0.0` from the `main` branch and triggers a GitHub release.

### Deployment
```
@bot deploy v2.0.0 to staging
@bot deploy v2.0.0 to production
```
Deploys the specified version to the specified environment.

### Help
```
@bot help
```
Shows available commands and usage examples.

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Mattermost Configuration
MATTERMOST_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/your-webhook-id
MATTERMOST_NOTIFICATIONS_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/notifications-webhook-id

# GitHub Configuration
GITHUB_TOKEN=ghp_your_github_personal_access_token
GITHUB_OWNER=your-organization-or-username
GITHUB_REPO=your-repository-name
```

### 2. GitHub Personal Access Token

Create a GitHub Personal Access Token with the following permissions:
- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows

### 3. Mattermost Slash Command

In your Mattermost instance, create a new slash command:

1. Go to **System Console** → **Integrations** → **Slash Commands**
2. Click **Add Slash Command**
3. Configure:
   - **Title**: `Bot Commands`
   - **Command**: `/bot`
   - **Request URL**: `https://your-tools-api.com/mattermost/command`
   - **Response Username**: `MattermostBot`
   - **Response Icon**: Choose an appropriate icon
   - **Description**: `Bot commands for development operations`

### 4. Mattermost Webhook (Optional)

For notifications back to Mattermost, create an incoming webhook:

1. Go to **System Console** → **Integrations** → **Incoming Webhooks**
2. Click **Add Incoming Webhook**
3. Configure the channel and permissions as needed

## Architecture

```
Mattermost → Tools API → GitHub API → GitHub Actions
    ↓              ↓           ↓           ↓
  Commands    Webhook    Repository   Workflows
              Handler    Dispatch
```

### Components

- **MattermostController**: Handles incoming webhook requests from Mattermost
- **MattermostBotService**: Processes commands and generates responses
- **GitHubWebhookService**: Triggers GitHub Actions via repository dispatch API
- **GitHub Actions**: Execute the actual operations (tagging, deployment)

## Security Considerations

### Request Verification

The current implementation accepts all requests. In production, you should implement proper request verification:

1. **Token Verification**: Verify the Mattermost token in each request
2. **Signature Verification**: Use Mattermost's request signing for webhooks
3. **User Permissions**: Check if the user has permission to perform the requested action

### GitHub Token Security

- Store the GitHub token securely
- Use the minimum required permissions
- Rotate the token regularly
- Consider using GitHub Apps instead of Personal Access Tokens for better security

## GitHub Actions Workflows

The bot triggers the following GitHub Actions workflows:

### `mattermost-bot.yml`

- **create-tag**: Creates tags and GitHub releases
- **deploy-staging**: Deploys to staging environment
- **deploy-production**: Deploys to production environment

### Customization

You can customize the deployment logic in the GitHub Actions workflows by:

1. Adding your build steps
2. Integrating with your deployment tools
3. Adding notifications to other services
4. Implementing approval workflows for production deployments

## Usage Examples

### Team Workflow

1. **Developer** requests a tag: `@bot tag main to v1.2.0`
2. **Bot** confirms and triggers GitHub Action
3. **GitHub Action** creates tag and release
4. **Team Lead** reviews and approves deployment: `@bot deploy v1.2.0 to staging`
5. **Bot** triggers staging deployment
6. **QA Team** tests staging deployment
7. **Team Lead** deploys to production: `@bot deploy v1.2.0 to production`

### Emergency Rollback

```
@bot deploy v1.1.0 to production
```

Quickly rollback to a previous stable version.

## Troubleshooting

### Common Issues

1. **GitHub Token Invalid**: Check token permissions and expiration
2. **Repository Not Found**: Verify `GITHUB_OWNER` and `GITHUB_REPO` values
3. **Webhook Not Working**: Check Mattermost webhook URL and permissions
4. **Actions Not Triggering**: Verify GitHub Actions workflow file exists

### Logs

Check the application logs for detailed error information:

```bash
# View logs
docker logs your-tools-container

# Or if running locally
npm run dev
```

### Testing

Test the integration locally:

1. Start the tools service
2. Use a tool like Postman to send requests to `/mattermost/command`
3. Check GitHub Actions tab for triggered workflows

## Contributing

When adding new commands:

1. Add the command logic to `MattermostBotService`
2. Update the help text
3. Add corresponding GitHub Actions workflow if needed
4. Update this documentation

## Support

For issues or questions:
1. Check the application logs
2. Verify environment variables
3. Test GitHub Actions manually
4. Contact the development team
