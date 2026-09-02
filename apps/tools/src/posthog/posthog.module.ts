import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { PostHogClientService } from './posthog-client.service';
import { PostHogCollectivitesSyncService } from './posthog-collectivites-sync.service';

@Module({
  imports: [ConfigurationModule],
  providers: [PostHogClientService, PostHogCollectivitesSyncService],
  exports: [PostHogCollectivitesSyncService],
})
export class PosthogModule {}
