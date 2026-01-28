import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GitHubWebhookPayload {
  event_type: string;
  client_payload: Record<string, any>;
}

@Injectable()
export class GitHubWebhookService {
  private readonly logger = new Logger(GitHubWebhookService.name);

  constructor(private configService: ConfigService) {}

  async triggerRepositoryDispatch(
    payload: GitHubWebhookPayload
  ): Promise<void> {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    const githubOwner = this.configService.get<string>('GITHUB_OWNER');
    const githubRepo = this.configService.get<string>('GITHUB_REPO');

    if (!githubToken || !githubOwner || !githubRepo) {
      throw new Error(
        'GitHub configuration missing. Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.'
      );
    }

    const url = `https://api.github.com/repos/${githubOwner}/${githubRepo}/dispatches`;

    try {
      this.logger.log(
        `Triggering GitHub repository dispatch: ${payload.event_type}`
      );

      await axios.post(url, payload, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'MattermostBot/1.0',
        },
      });

      this.logger.log(
        `Successfully triggered GitHub repository dispatch: ${payload.event_type}`
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to trigger GitHub repository dispatch: ${error.message}`
      );
      if (error.response) {
        this.logger.error(
          `GitHub API response: ${JSON.stringify(error.response.data)}`
        );
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }
  }

  async createTag(
    branch: string,
    version: string,
    requestedBy: string
  ): Promise<void> {
    await this.triggerRepositoryDispatch({
      event_type: 'create_tag',
      client_payload: {
        branch,
        version,
        requested_by: requestedBy,
      },
    });
  }

  async deployVersion(
    version: string,
    environment: string,
    requestedBy: string
  ): Promise<void> {
    await this.triggerRepositoryDispatch({
      event_type: 'deploy',
      client_payload: {
        version,
        environment,
        requested_by: requestedBy,
      },
    });
  }
}
