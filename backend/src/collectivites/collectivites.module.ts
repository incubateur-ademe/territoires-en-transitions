import { Module } from '@nestjs/common';
import { CollectiviteController } from './collectivite.controller';
import { CollectivitesRouter } from './collectivites.router';
import DocumentService from './documents/services/document.service';
import { ListCategoriesRouter } from './handle-categories/list-categories.router';
import ListCategoriesService from './handle-categories/list-categories.service';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';
import ListCollectivitesService from './list-collectivites/list-collectivites.service';
import { CollectiviteMembresRouter } from './membres/membres.router';
import { CollectiviteMembresService } from './membres/membres.service';
import { PersonnesRouter } from './personnes.router';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';
import { PersonnesService } from './services/personnes.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { TableauDeBordModule } from './tableau-de-bord/tableau-de-bord.module';
import CollectiviteUpsertService from '@/backend/collectivites/collectivite-upsert/collectivite-upsert.service';
import { CollectiviteUpsertRouter } from '@/backend/collectivites/collectivite-upsert/collectivite-upsert.router';

@Module({
  imports: [TableauDeBordModule],
  providers: [
    CollectivitesRouter,
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    DocumentService,
    TagService,
    ListCollectivitesRouter,
    ListCollectivitesService,
    CollectiviteUpsertService,
    CollectiviteUpsertRouter,
  ],
  exports: [
    CollectivitesRouter,
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    DocumentService,
    TagService,
    CollectiviteUpsertService,
    CollectiviteUpsertRouter,
  ],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
