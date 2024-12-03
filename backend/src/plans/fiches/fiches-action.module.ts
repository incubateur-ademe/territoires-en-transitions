import { AuthModule } from '@/backend/auth';
import { CollectivitesModule, TagService } from '@/backend/collectivites';
import { Module } from '@nestjs/common';
import { BulkEditRouter } from './bulk-edit/bulk-edit.router';
import { BulkEditService } from './bulk-edit/bulk-edit.service';
import { CountByStatutRouter } from './count-by-statut/count-by-statut.router';
import { CountByStatutService } from './count-by-statut/count-by-statut.service';
import FichesActionUpdateService from './edit/fiches-action-update.service';
import { FicheActionEtapeRouter } from './fiche-action-etape/fiche-action-etape.router';
import { FicheActionEtapeService } from './fiche-action-etape/fiche-action-etape.service';
import { FicheService } from './fiche.service';
import { FichesActionController } from './fiches-action.controller';
import { CommonModule } from '@/backend/utils';

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
