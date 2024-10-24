import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import FichesActionSyntheseService from './services/fiches-action-synthese.service';
import FichesActionUpdateService from './services/fiches-action-update.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [FichesActionSyntheseService, FichesActionUpdateService],
  exports: [FichesActionSyntheseService],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
