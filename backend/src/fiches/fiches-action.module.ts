import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import FichesActionSyntheseService from './services/fiches-action-synthese.service';
import FichesActionUpdateService from './services/fiches-action-update.service';
import FicheService from './services/fiche.service';
import TagService from '../taxonomie/services/tag.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [
    FicheService,
    FichesActionSyntheseService,
    FichesActionUpdateService,
    TagService,
  ],
  exports: [FichesActionSyntheseService],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
