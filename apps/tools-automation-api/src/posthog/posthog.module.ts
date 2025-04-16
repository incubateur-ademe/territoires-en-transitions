import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@/tools-automation-api/config/configuration.module';
import { PosthogService } from '@/tools-automation-api/posthog/posthog.service';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [PosthogService],
  exports: [PosthogService],
})
export class PosthogModule {}
