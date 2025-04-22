import { AirtableModule } from '@/tools-automation-api/airtable/airtable.module';
import { CalendlySynchroService } from '@/tools-automation-api/calendly/calendly-synchro.service';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { UtilsModule } from '../utils/utils.module';
import { CalendlyApiService } from './calendly-api.service';

@Module({
  imports: [ConfigurationModule, UtilsModule, AirtableModule],
  providers: [CalendlyApiService, CalendlySynchroService],
  exports: [CalendlySynchroService],
})
export class CalendlyModule {}
