import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CollectiviteController } from './controllers/collectivite.controller';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';

@Module({
  imports: [CommonModule],
  providers: [CollectivitesService, GroupementsService],
  exports: [CollectivitesService, GroupementsService],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
