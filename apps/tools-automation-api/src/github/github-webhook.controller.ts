import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import ConfigurationService from '../config/configuration.service';
import { GitHubWebhookService } from './github-webhook.service';

@Controller('github')
export class GitHubWebhookController {
  private readonly logger = new Logger(GitHubWebhookController.name);

  constructor(
    private readonly githubWebhookService: GitHubWebhookService,
    private readonly configService: ConfigurationService
  ) {}

  @Post()
  async handleWebhook(
    @Headers('x-github-event') eventType: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() payload: any
  ) {
    // Verify webhook signature
    this.verifySignature(signature, JSON.stringify(payload));

    this.logger.log(`Received webhook event: ${eventType}`);

    // Handle pull request events
    if (eventType === 'pull_request') {
      await this.githubWebhookService.handlePullRequestEvent(payload);
    }

    if (eventType === 'pull_request_review') {
      await this.githubWebhookService.handlePullRequestReviewEvent(payload);
    }

    return { received: true };
  }

  private verifySignature(signature: string, payload: string) {
    const secret = this.configService.get('GITHUB_WEBHOOK_SECRET');
    if (!secret) {
      throw new Error('GITHUB_WEBHOOK_SECRET is not configured');
    }

    const hmac = createHmac('sha256', secret);
    const digest = `sha256=${hmac.update(payload).digest('hex')}`;

    if (signature !== digest) {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
