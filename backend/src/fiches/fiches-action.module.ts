import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import SyntheseService from './services/synthese.service';
import FichesActionUpdateService from './services/fiches-action-update.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [SyntheseService, FichesActionUpdateService],
  exports: [SyntheseService],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
