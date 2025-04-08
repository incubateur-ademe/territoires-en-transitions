import { AirtableService } from '@/tools-automation-api/airtable/airtable.service';
import { ConfigurationModule } from '@/tools-automation-api/config/configuration.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [AirtableService],
  exports: [AirtableService],
})
export class AirtableModule {}
