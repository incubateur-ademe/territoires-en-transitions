import { CollectiviteCrudRouter } from '@/backend/collectivites/collectivite-crud/collectivite-crud.router';
import CollectiviteCrudService from '@/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { DocumentController } from '@/backend/collectivites/documents/document.controller';
import { ImportCollectiviteRelationsRouter } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.router';
import { ImportCollectiviteRelationsService } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.service';
import { ExportConnectService } from '@/backend/collectivites/membres/export-connect.service';
import { RecherchesRouter } from '@/backend/collectivites/recherches/recherches.router';
import RecherchesService from '@/backend/collectivites/recherches/recherches.service';
import { PersonneTagRouter } from '@/backend/collectivites/tags/personnes/personne-tag.router';
import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
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
import { TableauDeBordModule } from './tableau-de-bord/tableau-de-bord.module';

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
    PersonneTagService,
    PersonneTagRouter,
    ListCollectivitesRouter,
    ListCollectivitesService,
    CollectiviteCrudService,
    CollectiviteCrudRouter,
    ExportConnectService,
    RecherchesService,
    RecherchesRouter,
    ImportCollectiviteRelationsService,
    ImportCollectiviteRelationsRouter,
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
    ListCollectivitesService,
    PersonneTagService,
    CollectiviteCrudService,
    CollectiviteCrudRouter,
    RecherchesService,
    RecherchesRouter,
    ImportCollectiviteRelationsService,
    ImportCollectiviteRelationsRouter,
  ],
  controllers: [CollectiviteController, DocumentController],
})
export class CollectivitesModule {}
