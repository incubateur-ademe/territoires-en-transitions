import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CollectivitesModule } from '../collectivites/collectivites.module';
import { CommonModule } from '../common/common.module';
import { TrpcModule } from '../trpc/trpc.module';
import { FichesActionController } from './controllers/fiches-action.controller';
import { SyntheseRouter } from './routers/synthese.router';
import FichesActionUpdateService from './services/fiches-action-update.service';
import SyntheseService from './services/synthese.service';

@Module({
  imports: [CommonModule, TrpcModule, AuthModule, CollectivitesModule],
  providers: [SyntheseService, SyntheseRouter, FichesActionUpdateService],
  exports: [SyntheseRouter],
  controllers: [FichesActionController],
})
export class FichesActionModule {}
