import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CollectiviteController } from './controllers/collectivite.controller';
import { PersonnesRouter } from './personnes.router';
import CollectivitesService from './shared/services/collectivites.service';
import GroupementsService from './shared/services/groupements.service';
import { PersonnesService } from './shared/services/personnes.service';

@Module({
  imports: [CommonModule],
  providers: [
    CollectivitesService,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
  ],
  exports: [CollectivitesService, GroupementsService, PersonnesRouter],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
