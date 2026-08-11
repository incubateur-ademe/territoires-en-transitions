import { Module } from '@nestjs/common';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { ApplyTransitionRepository } from './apply-transition/apply-transition.repository';
import { ApplyTransitionRouter } from './apply-transition/apply-transition.router';
import { ApplyTransitionService } from './apply-transition/apply-transition.service';
import { CreateDemarchePcaetRepository } from './create-demarche-pcaet/create-demarche-pcaet.repository';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { DeleteDemarchePcaetRepository } from './delete-demarche-pcaet/delete-demarche-pcaet.repository';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { DeleteDemarchePcaetService } from './delete-demarche-pcaet/delete-demarche-pcaet.service';
import { CreateDemarchePcaetService } from './create-demarche-pcaet/create-demarche-pcaet.service';
import { AddDemarchePcaetDocumentRouter } from './documents/add-document/add-document.router';
import { AddDemarchePcaetDocumentService } from './documents/add-document/add-document.service';
import { ListDemarchePcaetDocumentsRouter } from './documents/list-documents/list-documents.router';
import { ListDemarchePcaetDocumentsService } from './documents/list-documents/list-documents.service';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { RemoveDemarchePcaetDocumentRouter } from './documents/remove-document/remove-document.router';
import { RemoveDemarchePcaetDocumentService } from './documents/remove-document/remove-document.service';
import { SetDemarchePcaetDocumentCouvertureRouter } from './documents/set-document-couverture/set-document-couverture.router';
import { SetDemarchePcaetDocumentCouvertureService } from './documents/set-document-couverture/set-document-couverture.service';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { GetDemarchePcaetRepository } from './get-demarche-pcaet/get-demarche-pcaet.repository';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { GetDemarchePcaetService } from './get-demarche-pcaet/get-demarche-pcaet.service';
import { GetDiagnosticRouter } from './get-diagnostic/get-diagnostic.router';
import { GetDiagnosticService } from './get-diagnostic/get-diagnostic.service';
import { ListDemandesAvisRepository } from './list-demandes-avis/list-demandes-avis.repository';
import { ListDemandesAvisRouter } from './list-demandes-avis/list-demandes-avis.router';
import { ListDemandesAvisService } from './list-demandes-avis/list-demandes-avis.service';
import { ListDemarchesPcaetRepository } from './list-demarches-pcaet/list-demarches-pcaet.repository';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ListDemarchesPcaetService } from './list-demarches-pcaet/list-demarches-pcaet.service';
import { PcaetRouter } from './pcaet.router';
import { SetPublicationStatusRepository } from './set-publication-status/set-publication-status.repository';
import { SetPublicationStatusRouter } from './set-publication-status/set-publication-status.router';
import { SetPublicationStatusService } from './set-publication-status/set-publication-status.service';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { DemarchePcaetDiagnosticRepository } from './shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from './shared/demarche-pcaet-diagnostic.service';
import { SetDiagnosticYearsRouter } from './set-diagnostic-years/set-diagnostic-years.router';
import { SetDiagnosticYearsService } from './set-diagnostic-years/set-diagnostic-years.service';
import { DemarchePcaetGuardsService } from './shared/demarche-pcaet-guards.service';
import { DepotPermissionsService } from './shared/depot-permissions.service';
import { DemarchePcaetPilotesRepository } from './shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from './shared/demarche-pcaet-ref.repository';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet/update-demarche-pcaet.repository';
import { UpdateDemarchePcaetService } from './update-demarche-pcaet/update-demarche-pcaet.service';

@Module({
  imports: [UsersModule, TransactionModule, IndicateursModule],
  providers: [
    DemarchePcaetPilotesRepository,
    DemarchePcaetGuardsService,
    DepotPermissionsService,
    DemarchePcaetRefRepository,
    DemarcheDocumentsRepository,
    GetDemarchePcaetRepository,
    GetDemarchePcaetService,
    GetDemarchePcaetRouter,
    DemarchePcaetDiagnosticRepository,
    DemarchePcaetDiagnosticService,
    SetDiagnosticYearsService,
    SetDiagnosticYearsRouter,
    GetDiagnosticService,
    GetDiagnosticRouter,
    PcaetDiagnosticRouter,
    ListDemarchesPcaetRepository,
    ListDemarchesPcaetService,
    ListDemarchesPcaetRouter,
    ListDemandesAvisRepository,
    ListDemandesAvisService,
    ListDemandesAvisRouter,
    CreateDemarchePcaetRepository,
    CreateDemarchePcaetService,
    CreateDemarchePcaetRouter,
    DeleteDemarchePcaetRepository,
    DeleteDemarchePcaetService,
    DeleteDemarchePcaetRouter,
    UpdateDemarchePcaetRepository,
    UpdateDemarchePcaetService,
    UpdateDemarchePcaetRouter,
    ApplyTransitionRepository,
    ApplyTransitionService,
    ApplyTransitionRouter,
    SetPublicationStatusRepository,
    SetPublicationStatusService,
    SetPublicationStatusRouter,
    ListDemarchePcaetDocumentsService,
    ListDemarchePcaetDocumentsRouter,
    AddDemarchePcaetDocumentService,
    AddDemarchePcaetDocumentRouter,
    RemoveDemarchePcaetDocumentService,
    RemoveDemarchePcaetDocumentRouter,
    SetDemarchePcaetDocumentCouvertureService,
    SetDemarchePcaetDocumentCouvertureRouter,
    PcaetDocumentsRouter,
    PcaetRouter,
  ],
  exports: [PcaetRouter],
})
export class PcaetModule {}
