import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import { CountByStatutService } from './count-by-statut/count-by-statut.service';
import FichesActionUpdateService from './services/fiches-action-update.service';
import FicheService from './services/fiche.service';
import TagService from '../taxonomie/services/tag.service';
import { CountByStatutRouter } from './count-by-statut/count-by-statut.router';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [
    FicheService,
    CountByStatutService,
    FichesActionUpdateService,
    TagService,
    CountByStatutRouter,
  ],
  exports: [CountByStatutService, CountByStatutRouter],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
