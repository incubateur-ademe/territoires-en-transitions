import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';
import { DatabaseModule } from './utils/database/database.module';
import { CrmModule } from './crm/crm.module';
import { ConfigurationModule } from '@/tools-automation-api/config/configuration.module';

@Module({
  imports: [ConfigurationModule, UtilsModule, DatabaseModule, CrmModule],
  controllers: [],
  providers: [],
  exports: [CrmModule],
})
export class AppModule {}
