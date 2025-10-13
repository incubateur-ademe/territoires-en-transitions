import { CollectiviteCrudRouter } from '@/backend/collectivites/collectivite-crud/collectivite-crud.router';
import CollectiviteCrudService from '@/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { DiscussionApplicationService } from '@/backend/collectivites/discussions/application/discussion-application.service';
import { DiscussionDomainService } from '@/backend/collectivites/discussions/domain/discussion-domain-service';
import { DiscussionRepositoryImpl } from '@/backend/collectivites/discussions/infrastructure/discussion.repository.impl';
import { DiscussionRouter } from '@/backend/collectivites/discussions/presentation/discussion.router';
import { DocumentController } from '@/backend/collectivites/documents/document.controller';
import { CreateDocumentRouter } from '@/backend/collectivites/documents/create-document/create-document.router';
import { CreateDocumentService } from '@/backend/collectivites/documents/create-document/create-document.service';
import { ImportCollectiviteRelationsRouter } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.router';
import { ImportCollectiviteRelationsService } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.service';
import { ExportConnectService } from '@/backend/collectivites/membres/export-connect.service';
import { RecherchesRouter } from '@/backend/collectivites/recherches/recherches.router';
import RecherchesService from '@/backend/collectivites/recherches/recherches.service';
import { PersonneTagRouter } from '@/backend/collectivites/tags/personnes/personne-tag.router';
import { PersonneTagService } from '@/backend/collectivites/tags/personnes/personne-tag.service';
import { TagService } from '@/backend/collectivites/tags/tag.service';
import { Logger, Module } from '@nestjs/common';
import { CollectiviteController } from './collectivite.controller';
import { CollectivitesRouter } from './collectivites.router';
import { DiscussionQueryService } from './discussions/domain/discussion-query-service';
import { ListDiscussionService } from './discussions/domain/list-discussion-service';
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
import { DocumentsRouter } from './documents/documents.router';

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
    CreateDocumentService,
    CreateDocumentRouter,
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
    CreateDocumentService,
    CreateDocumentRouter,
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
