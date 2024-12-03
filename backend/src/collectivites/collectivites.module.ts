import { Module } from '@nestjs/common';
import { CommonModule } from '../utils/common/common.module';
import { PersonnesRouter } from './personnes.router';
import { CollectiviteController } from './shared/controllers/collectivite.controller';
import { GetCategoriesByCollectiviteRouter } from './shared/routers/get-categories-by-collectivite.router';
import { CollectivitesService } from './shared/services/collectivites.service';
import GroupementsService from './shared/services/groupements.service';
import { PersonnesService } from './shared/services/personnes.service';
import { TagService } from './shared/services/tag.service';

@Module({
  imports: [CommonModule],
  providers: [
    CollectivitesService,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
    TagService,
    GetCategoriesByCollectiviteRouter,
  ],
  exports: [
    CollectivitesService,
    GroupementsService,
    PersonnesRouter,
    GetCategoriesByCollectiviteRouter,
  ],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
