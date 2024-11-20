import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import { CountByStatutRouter } from './routers/count-by-statut.router';
import CountByService from './services/count-by.service';
import FichesActionUpdateService from './services/fiches-action-update.service';

@Module({
  imports: [CommonModule, AuthModule, CollectivitesModule],
  providers: [CountByService, CountByStatutRouter, FichesActionUpdateService],
  exports: [CountByStatutRouter],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
