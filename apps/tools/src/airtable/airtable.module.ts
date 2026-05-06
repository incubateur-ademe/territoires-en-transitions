import { AirtableCrmSyncService } from './airtable-crm-sync.service';
import { AirtableService } from './airtable.service';
import { ConfigurationModule } from '../config/configuration.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [AirtableService, AirtableCrmSyncService],
  exports: [AirtableService, AirtableCrmSyncService],
})
export class AirtableModule {}
