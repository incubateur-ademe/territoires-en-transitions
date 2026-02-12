import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubWebhookService } from './github-webhook.service';

export interface MattermostCommand {
  channel_id: string;
  channel_name: string;
  command: string;
  response_url: string;
  team_domain: string;
  team_id: string;
  text: string;
  token: string;
  trigger_id: string;
  user_id: string;
  username: string;
}

export interface MattermostResponse {
  response_type?: 'in_channel' | 'ephemeral';
  text: string;
  attachments?: any[];
}

@Injectable()
export class MattermostBotService {
  private readonly logger = new Logger(MattermostBotService.name);

  constructor(
    private configService: ConfigService,
    private githubWebhookService: GitHubWebhookService
  ) {}

  async handleCommand(command: MattermostCommand): Promise<MattermostResponse> {
    const { text, username } = command;
    const args = text.trim().split(/\s+/);
    const action = args[0]?.toLowerCase();

    this.logger.log(`Received command from ${username}: ${text}`);

    try {
      switch (action) {
        case 'tag':
          return await this.handleTagCommand(args, username);
        case 'deploy':
          return await this.handleDeployCommand(args, username);
        case 'help':
          return this.getHelpResponse();
        default:
          return {
            response_type: 'ephemeral',
            text: `Unknown command: ${action}. Use \`help\` to see available commands.`,
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Error handling command: ${errorMessage}`,
        error instanceof Error ? error.stack : ''
      );
      return {
        response_type: 'ephemeral',
        text: `❌ Error: ${errorMessage}`,
      };
    }
  }

  private async handleTagCommand(
    args: string[],
    username: string
  ): Promise<MattermostResponse> {
    if (args.length < 3) {
      return {
        response_type: 'ephemeral',
        text: 'Usage: `tag <branch> to <version>`\nExample: `tag main to v2.0.0`',
      };
    }

    const branch = args[1];
    const version = args[3];

    if (!version || !version.startsWith('v')) {
      return {
        response_type: 'ephemeral',
        text: 'Version must start with "v" (e.g., v2.0.0)',
      };
    }

    try {
      // Trigger GitHub Action via repository dispatch
      await this.githubWebhookService.createTag(branch, version, username);

      return {
        response_type: 'in_channel',
        text: `🚀 **${username}** requested to tag \`${branch}\` branch to \`${version}\`\n\nThis will trigger the GitHub Action to create the tag.`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to trigger tag creation: ${errorMessage}`);
    }
  }

  private async handleDeployCommand(
    args: string[],
    username: string
  ): Promise<MattermostResponse> {
    if (args.length < 3) {
      return {
        response_type: 'ephemeral',
        text: 'Usage: `deploy <version> to <environment>`\nExample: `deploy v2.0.0 to staging`',
      };
    }

    const version = args[1];
    const environment = args[3];

    if (!version || !version.startsWith('v')) {
      return {
        response_type: 'ephemeral',
        text: 'Version must start with "v" (e.g., v2.0.0)',
      };
    }

    if (!['staging', 'production'].includes(environment)) {
      return {
        response_type: 'ephemeral',
        text: 'Environment must be either "staging" or "production"',
      };
    }

    try {
      // Trigger GitHub Action via repository dispatch
      await this.githubWebhookService.deployVersion(
        version,
        environment,
        username
      );

      return {
        response_type: 'in_channel',
        text: `🚀 **${username}** requested to deploy \`${version}\` to \`${environment}\`\n\nThis will trigger the GitHub Action to deploy the version.`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to trigger deployment: ${errorMessage}`);
    }
  }

  private getHelpResponse(): MattermostResponse {
    return {
      response_type: 'ephemeral',
      text: `🤖 **Mattermost Bot Commands**

**Tag Management:**
• \`tag <branch> to <version>\` - Tag a branch with a new version
  Example: \`tag main to v2.0.0\`

**Deployment:**
• \`deploy <version> to <environment>\` - Deploy a version to an environment
  Example: \`deploy v2.0.0 to staging\`

**Other:**
• \`help\` - Show this help message

All commands will trigger GitHub Actions to perform the actual operations.`,
    };
  }

  async sendNotification(
    channel: string,
    message: string,
    attachments?: any[]
  ): Promise<void> {
    const webhookUrl = this.configService.get<string>('MATTERMOST_WEBHOOK_URL');
    if (!webhookUrl) {
      this.logger.warn('Mattermost webhook URL not configured');
      return;
    }

    try {
      // Import axios dynamically to avoid dependency issues
      const { default: axios } = await import('axios');
      await axios.post(webhookUrl, {
        channel,
        text: message,
        attachments,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Failed to send Mattermost notification: ${errorMessage}`
      );
    }
  }
}
