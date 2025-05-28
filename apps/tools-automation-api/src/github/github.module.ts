import { UtilsModule } from '@/tools-automation-api/utils/utils.module';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import MattermostNotificationService from '../utils/mattermost-notification.service';
import { GitHubWebhookController } from './github-webhook.controller';
import { GitHubWebhookService } from './github-webhook.service';

@Module({
  imports: [ConfigurationModule, UtilsModule],
  controllers: [GitHubWebhookController],
  providers: [GitHubWebhookService, MattermostNotificationService],
  exports: [GitHubWebhookService],
})
export class GitHubModule {}
