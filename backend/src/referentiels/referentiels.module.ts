import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { ConfigurationModule } from '../config/configuration.module';
import { PersonnalisationsModule } from '../personnalisations/personnalisations.module';
import { SheetModule } from '../spreadsheets/sheet.module';
import { ReferentielsScoringController } from './controllers/referentiels-scoring.controller';
import { ReferentielsController } from './controllers/referentiels.controller';
import LabellisationService from './services/labellisation.service';
import ReferentielsScoringService from './services/referentiels-scoring.service';
import ReferentielsService from './services/referentiels.service';

@Module({
  imports: [
    AuthModule,
    CollectivitesModule,
    CommonModule,
    ConfigurationModule,
    SheetModule,
    PersonnalisationsModule,
  ],
  providers: [
    ReferentielsService,
    LabellisationService,
    ReferentielsScoringService,
  ],
  exports: [
    ReferentielsService,
    LabellisationService,
    ReferentielsScoringService,
  ],
  controllers: [ReferentielsController, ReferentielsScoringController],
})
export class ReferentielsModule {}
