import { Module } from '@nestjs/common';
import { CollectiviteController } from './collectivite.controller';
import DocumentService from './documents/services/document.service';
import { ListCategoriesRouter } from './handle-categories/list-categories.router';
import ListCategoriesService from './handle-categories/list-categories.service';
import { CollectiviteMembresRouter } from './membres/membres.router';
import { CollectiviteMembresService } from './membres/membres.service';
import { PersonnesRouter } from './personnes.router';
import CollectivitesService from './services/collectivites.service';
import GroupementsService from './services/groupements.service';
import { PersonnesService } from './services/personnes.service';

@Module({
  imports: [],
  providers: [
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    DocumentService,
  ],
  exports: [
    CollectivitesService,
    CollectiviteMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    DocumentService,
  ],
  controllers: [CollectiviteController],
})
export class CollectivitesModule {}
