import { Module } from '@nestjs/common';
import { ConfigurationModule } from '@tet/backend/utils/config/configuration.module';
import GetPlanUrlService from './get-plan-url.service';

@Module({
  imports: [ConfigurationModule],
  providers: [GetPlanUrlService],
  exports: [GetPlanUrlService],
})
export class PlansUtilsModule {}
