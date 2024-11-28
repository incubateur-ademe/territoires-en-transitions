import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import TagService from '../taxonomie/services/tag.service';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { BulkEditService } from './bulk-edit/bulk-edit.service';
import { FichesActionController } from './controllers/fiches-action.controller';
import { CountByStatutRouter } from './count-by-statut/count-by-statut.router';
import { CountByStatutService } from './count-by-statut/count-by-statut.service';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { FicheActionEtapeService } from './fiche-action-etape/fiche-action-etape.service';
import FicheService from './services/fiche.service';
import FichesActionUpdateService from './services/fiches-action-update.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [
    FicheService,
    CountByStatutService,
    CountByStatutRouter,
    BulkEditService,
    BulkEditRouter,
    FichesActionUpdateService,
    TagService,
    CountByStatutRouter,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
  ],
  exports: [
    CountByStatutService,
    CountByStatutRouter,
    FicheActionEtapeService,
    FicheActionEtapeRouter,
    BulkEditRouter,
  ],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
