import { AirtableService } from './airtable.service';
import { ConfigurationModule } from '../config/configuration.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigurationModule],
  controllers: [],
  providers: [AirtableService],
  exports: [AirtableService],
})
export class AirtableModule {}
