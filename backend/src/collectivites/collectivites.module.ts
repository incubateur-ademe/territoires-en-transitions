import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';

@Module({
  imports: [CommonModule],
  providers: [CollectivitesService, GroupementsService],
  exports: [CollectivitesService, GroupementsService],
  controllers: [],
})
export class CollectivitesModule {}
