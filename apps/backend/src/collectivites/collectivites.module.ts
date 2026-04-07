import { Logger, Module } from '@nestjs/common';
import { CollectiviteCrudRouter } from '@tet/backend/collectivites/collectivite-crud/collectivite-crud.router';
import CollectiviteCrudService from '@tet/backend/collectivites/collectivite-crud/collectivite-crud.service';
import { CollectivitePreferencesRepository } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.repository';
import { CollectivitePreferencesRouter } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.router';
import { CollectivitePreferencesService } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.service';
import { DocumentController } from '@tet/backend/collectivites/documents/document.controller';
import { StoreDocumentRouter } from '@tet/backend/collectivites/documents/store-document/store-document.router';
import { StoreDocumentService } from '@tet/backend/collectivites/documents/store-document/store-document.service';
import { UpdateDocumentRouter } from '@tet/backend/collectivites/documents/update-document/update-document.router';
import { UpdateDocumentService } from '@tet/backend/collectivites/documents/update-document/update-document.service';
import { ImportCollectiviteRelationsRouter } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.router';
import { ImportCollectiviteRelationsService } from '@tet/backend/collectivites/import-collectivite-relations/import-collectivite-relations.service';
import { ExportConnectService } from '@tet/backend/collectivites/membres/sync-membres-with-crm-connect/export-connect.service';
import { RecherchesRouter } from '@tet/backend/collectivites/recherches/recherches.router';
import RecherchesService from '@tet/backend/collectivites/recherches/recherches.service';
import { PersonneTagRouter } from '@tet/backend/collectivites/tags/personnes/personne-tag.router';
import { PersonneTagService } from '@tet/backend/collectivites/tags/personnes/personne-tag.service';
import { TagService } from '@tet/backend/collectivites/tags/tag.service';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { CollectiviteController } from './collectivite.controller';
import { CollectivitesCoreModule } from './collectivites-core.module';
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
import { InstanceGouvernanceRepository } from './handle-instance-gouvernance/handle-instance-gouvernance.repository';
import { InstanceGouvernanceRouter } from './handle-instance-gouvernance/handle-instance-gouvernance.router';
import { InstanceGouvernanceService } from './handle-instance-gouvernance/handle-instance-gouvernance.service';
import { ListCollectivitesRouter } from './list-collectivites/list-collectivites.router';
import ListCollectivitesService from './list-collectivites/list-collectivites.service';
import { ListMembresService } from './membres/list-membres/list-membres.service';
import { ListPendingInvitationsService } from './membres/list-pending-invitations/list-pending-invitations.service';
import { CollectiviteMembresRouter } from './membres/membres.router';
import { InvitationService } from './membres/mutate-invitations/invitation.service';
import { InvitationsRouter } from './membres/mutate-invitations/invitations.router';
import { MutateMembresService } from './membres/mutate-membres/mutate-membres.service';
import { PersonnalisationsModule } from './personnalisations/personnalisations.module';
import { PersonnesRouter } from './personnes.router';
import GroupementsService from './services/groupements.service';
import { PersonnesService } from './services/personnes.service';
import { TableauDeBordModule } from './tableau-de-bord/tableau-de-bord.module';

@Module({
  imports: [
    CollectivitesCoreModule,
    PersonnalisationsModule,
    TableauDeBordModule,
    TransactionModule,
  ],
  providers: [
    CollectivitesRouter,
    ListMembresService,
    ListPendingInvitationsService,
    InvitationService,
    InvitationsRouter,

    MutateMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    StoreDocumentService,
    StoreDocumentRouter,
    UpdateDocumentService,
    UpdateDocumentRouter,
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
    CollectivitePreferencesRepository,
    CollectivitePreferencesService,
    CollectivitePreferencesRouter,
    DiscussionRouter,
    DiscussionApplicationService,
    DiscussionDomainService,
    DiscussionQueryService,
    ListDiscussionService,
    InstanceGouvernanceRouter,
    InstanceGouvernanceService,
    InstanceGouvernanceRepository,
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
    CollectivitesCoreModule,
    CollectivitesRouter,
    ListMembresService,
    CollectiviteMembresRouter,
    GroupementsService,
    PersonnesRouter,
    ListCategoriesService,
    ListCategoriesRouter,
    StoreDocumentService,
    StoreDocumentRouter,
    UpdateDocumentService,
    UpdateDocumentRouter,
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
    CollectivitePreferencesRepository,
    CollectivitePreferencesRouter,
    CollectivitePreferencesService,
    DiscussionRouter,
    DiscussionApplicationService,
    DiscussionDomainService,
    InstanceGouvernanceRouter,
    InstanceGouvernanceService,
  ],
  controllers: [CollectiviteController, DocumentController],
})
export class CollectivitesModule {}
