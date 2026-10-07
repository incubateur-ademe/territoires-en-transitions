import { AirtableModule } from '../airtable/airtable.module';
import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../config/configuration.module';
import { NotionModule } from '../notion/notion.module';
import { CrispController } from './controllers/crisp.controller';
import { BuildCrispCrmNoteService } from './services/build-crisp-crm-note.service';
import { BuildCrispUserDataService } from './services/build-crisp-user-data.service';
import { CrispService } from './services/crisp.service';

@Module({
  imports: [ConfigurationModule, NotionModule, AirtableModule],
  controllers: [CrispController],
  providers: [
    CrispService,
    BuildCrispUserDataService,
    BuildCrispCrmNoteService,
  ],
})
export class CrispModule {}
