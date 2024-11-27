import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CollectiviteController } from './controllers/collectivite.controller';
import { PersonnesRouter } from './personnes.router';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';
import { PersonnesService } from './services/personnes.service';

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
