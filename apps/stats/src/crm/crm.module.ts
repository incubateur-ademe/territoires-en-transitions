import { Module } from '@nestjs/common';
import CrmService from './crm.service';
import { PosthogModule } from '@/tools-automation-api/posthog/posthog.module';
import { ConfigurationModule } from '@/tools-automation-api/config/configuration.module';

@Module({
  imports: [ConfigurationModule, PosthogModule],
  controllers: [],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
