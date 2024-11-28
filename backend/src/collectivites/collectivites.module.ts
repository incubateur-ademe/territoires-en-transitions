import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { CollectiviteController } from './controllers/collectivite.controller';
import { PersonnesRouter } from './personnes.router';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';
import { PersonnesService } from './services/personnes.service';
import { CollectiviteMembresService } from './membres/membres.service';
import { CollectiviteMembresRouter } from './membres/membres.router';

@Module({
  imports: [CommonModule],
  providers: [
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
  ],
  exports: [
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesRouter,
  ],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
