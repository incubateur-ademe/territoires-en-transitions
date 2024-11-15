import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { TrpcModule } from '../trpc/trpc.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import FichesActionUpdateService from './services/fiches-action-update.service';
import CountByService from './services/count-by.service';
import { CountByStatutRouter } from './routers/count-by-statut.router';

@Module({
  imports: [CommonModule, TrpcModule, AuthModule, CollectivitesModule],
  providers: [CountByService, CountByStatutRouter, FichesActionUpdateService],
  exports: [CountByStatutRouter],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
