import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import TagService from '../taxonomie/services/tag.service';
import { FichesActionController } from './controllers/fiches-action.controller';
import { CountByStatutRouter } from './routers/count-by-statut.router';
import CountByService from './services/count-by.service';
import FicheService from './services/fiche.service';
import FichesActionUpdateService from './services/fiches-action-update.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [
    FicheService,
    CountByService,
    CountByStatutRouter,
    FichesActionUpdateService,
    TagService,
  ],
  exports: [CountByStatutRouter],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
