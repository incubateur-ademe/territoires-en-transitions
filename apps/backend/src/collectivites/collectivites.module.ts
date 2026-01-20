import { Logger, Module } from '@nestjs/common';
import { CollectiviteCrudRouter } from '@tet/backend/collectivites/collectivite-crud/collectivite-crud.router';
import CollectiviteCrudService from '@tet/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { DocumentController } from '@tet/backend/collectivites/documents/document.controller';
import { StoreDocumentRouter } from '@tet/backend/collectivites/documents/store-document/store-document.router';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { ImportCollectiviteRelationsRouter } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.router';
import { ImportCollectiviteRelationsService } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.service';
import { ExportConnectService } from '@tet/backend/collectivites/membres/export-connect.service';
import { RecherchesRouter } from '@tet/backend/collectivites/recherches/recherches.router';
import RecherchesService from '@tet/backend/collectivites/recherches/recherches.service';
import { PersonneTagRouter } from '@tet/backend/collectivites/tags/personnes/personne-tag.router';
import { PersonneTagService } from '@tet/backend/collectivites/tags/personnes/personne-tag.service';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { CollectiviteController } from './collectivite.controller';
import { CollectivitesRouter } from './collectivites.router';
import { DiscussionApplicationService } from './discussions/application/discussion-application.service';
import { DiscussionDomainService } from './discussions/domain/discussion-domain-service';
import { DiscussionQueryService } from './discussions/domain/discussion-query-service';
import { ListDiscussionService } from './discussions/domain/list-discussion-service';
import { DiscussionRepositoryImpl } from './discussions/infrastructure/discussion.repository.impl';
import { DiscussionRouter } from './discussions/presentation/discussion.router';
import DocumentService from './documents/document.service';
import { DocumentsRouter } from './documents/documents.router';
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
    StoreDocumentService,
    StoreDocumentRouter,
    DocumentsRouter,
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
    DiscussionRouter,
    DiscussionApplicationService,
    DiscussionDomainService,
    DiscussionQueryService,
    ListDiscussionService,
    {
      provide: Logger,
      useValue: new Logger('DiscussionApplicationService'),
    },
    {
      provide: 'DiscussionRepository',
      useClass: DiscussionRepositoryImpl,
    },
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
    StoreDocumentService,
    StoreDocumentRouter,
    DocumentService,
    DocumentsRouter,
    TagService,
    ListCollectivitesService,
    PersonneTagService,
    CollectiviteCrudService,
    CollectiviteCrudRouter,
    RecherchesService,
    RecherchesRouter,
    ImportCollectiviteRelationsService,
    ImportCollectiviteRelationsRouter,
    DiscussionRouter,
    DiscussionApplicationService,
    DiscussionDomainService,
  ],
  controllers: [CollectiviteController, DocumentController],
})
export class CollectivitesModule {}
