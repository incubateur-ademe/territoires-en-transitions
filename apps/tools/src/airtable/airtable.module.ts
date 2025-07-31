import { AirtableService } from '@/tools/airtable/airtable.service';
import { ConfigurationModule } from '@/tools/config/configuration.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [AirtableService],
  exports: [AirtableService],
})
export class AirtableModule {}
