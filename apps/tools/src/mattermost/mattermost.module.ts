import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { GitHubWebhookService } from './github-webhook.service';
import { MattermostBotService } from './mattermost-bot.service';
import { MattermostController } from './mattermost.controller';

@Module({
  imports: [ConfigurationModule],
  controllers: [MattermostController],
  providers: [MattermostBotService, GitHubWebhookService],
  exports: [MattermostBotService],
})
export class MattermostModule {}
