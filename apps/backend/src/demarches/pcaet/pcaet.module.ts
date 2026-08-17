import { Module } from '@nestjs/common';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
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
import { ListDemarchesPcaetRepository } from './list-demarches-pcaet/list-demarches-pcaet.repository';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ListDemarchesPcaetService } from './list-demarches-pcaet/list-demarches-pcaet.service';
import { PcaetRouter } from './pcaet.router';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { DemarchePcaetDiagnosticRepository } from './shared/demarche-pcaet-diagnostic.repository';
import { DemarchePcaetDiagnosticService } from './shared/demarche-pcaet-diagnostic.service';
import { SetDiagnosticYearsRouter } from './set-diagnostic-years/set-diagnostic-years.router';
import { SetDiagnosticYearsService } from './set-diagnostic-years/set-diagnostic-years.service';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { TransmettrePourAvisDemarchePcaetService } from './transmettre-pour-avis/transmettre-pour-avis.service';
import { ReprendreElaborationDemarchePcaetRouter } from './reprendre-elaboration/reprendre-elaboration.router';
import { ReprendreElaborationDemarchePcaetService } from './reprendre-elaboration/reprendre-elaboration.service';
import { AdopterDemarchePcaetRouter } from './adopter-demarche/adopter-demarche.router';
import { AdopterDemarchePcaetService } from './adopter-demarche/adopter-demarche.service';
import { PublierDemarchePcaetRouter } from './publier-demarche/publier-demarche.router';
import { PublierDemarchePcaetService } from './publier-demarche/publier-demarche.service';
import { DepublierDemarchePcaetRouter } from './depublier-demarche/depublier-demarche.router';
import { DepublierDemarchePcaetService } from './depublier-demarche/depublier-demarche.service';
import { ArchiverDemarchePcaetRouter } from './archiver-demarche/archiver-demarche.router';
import { ArchiverDemarchePcaetService } from './archiver-demarche/archiver-demarche.service';
import { DemarchePcaetGuardsService } from './shared/demarche-pcaet-guards.service';
import { DemarchePcaetTransitionRepository } from './shared/demarche-pcaet-transition.repository';
import { DemarchePcaetTransitionService } from './shared/demarche-pcaet-transition.service';
import { DemarchePcaetPilotesRepository } from './shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from './shared/demarche-pcaet-ref.repository';
import { DemarchePcaetAccessService } from './shared/demarche-pcaet-access.service';
import { DemarchePcaetVulnerabiliteReadService } from './shared/demarche-pcaet-vulnerabilite-read.service';
import { DemarchePcaetVulnerabiliteRepository } from './shared/demarche-pcaet-vulnerabilite.repository';
import { AddVulnerabiliteDomaineRouter } from './add-vulnerabilite-domaine/add-vulnerabilite-domaine.router';
import { AddVulnerabiliteDomaineService } from './add-vulnerabilite-domaine/add-vulnerabilite-domaine.service';
import { RemoveVulnerabiliteDomaineRouter } from './remove-vulnerabilite-domaine/remove-vulnerabilite-domaine.router';
import { RemoveVulnerabiliteDomaineService } from './remove-vulnerabilite-domaine/remove-vulnerabilite-domaine.service';
import { SetVulnerabiliteLigneRouter } from './set-vulnerabilite-ligne/set-vulnerabilite-ligne.router';
import { SetVulnerabiliteLigneService } from './set-vulnerabilite-ligne/set-vulnerabilite-ligne.service';
import { UpdateVulnerabiliteDomaineRouter } from './update-vulnerabilite-domaine/update-vulnerabilite-domaine.router';
import { UpdateVulnerabiliteDomaineService } from './update-vulnerabilite-domaine/update-vulnerabilite-domaine.service';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet/update-demarche-pcaet.repository';
import { UpdateDemarchePcaetService } from './update-demarche-pcaet/update-demarche-pcaet.service';

@Module({
  imports: [UsersModule, TransactionModule, IndicateursModule, PlanModule],
  providers: [
    DemarchePcaetPilotesRepository,
    DemarchePcaetGuardsService,
    DemarchePcaetTransitionService,
    DemarchePcaetTransitionRepository,
    TransmettrePourAvisDemarchePcaetService,
    TransmettrePourAvisDemarchePcaetRouter,
    ReprendreElaborationDemarchePcaetService,
    ReprendreElaborationDemarchePcaetRouter,
    AdopterDemarchePcaetService,
    AdopterDemarchePcaetRouter,
    PublierDemarchePcaetService,
    PublierDemarchePcaetRouter,
    DepublierDemarchePcaetService,
    DepublierDemarchePcaetRouter,
    ArchiverDemarchePcaetService,
    ArchiverDemarchePcaetRouter,
    DemarchePcaetRefRepository,
    DemarcheDocumentsRepository,
    GetDemarchePcaetRepository,
    GetDemarchePcaetService,
    GetDemarchePcaetRouter,
    DemarchePcaetDiagnosticRepository,
    DemarchePcaetVulnerabiliteReadService,
    DemarchePcaetDiagnosticService,
    SetDiagnosticYearsService,
    SetDiagnosticYearsRouter,
    GetDiagnosticService,
    GetDiagnosticRouter,
    DemarchePcaetVulnerabiliteRepository,
    DemarchePcaetAccessService,
    SetVulnerabiliteLigneService,
    SetVulnerabiliteLigneRouter,
    AddVulnerabiliteDomaineService,
    AddVulnerabiliteDomaineRouter,
    UpdateVulnerabiliteDomaineService,
    UpdateVulnerabiliteDomaineRouter,
    RemoveVulnerabiliteDomaineService,
    RemoveVulnerabiliteDomaineRouter,
    PcaetDiagnosticRouter,
    ListDemarchesPcaetRepository,
    ListDemarchesPcaetService,
    ListDemarchesPcaetRouter,
    CreateDemarchePcaetRepository,
    CreateDemarchePcaetService,
    CreateDemarchePcaetRouter,
    DeleteDemarchePcaetRepository,
    DeleteDemarchePcaetService,
    DeleteDemarchePcaetRouter,
    UpdateDemarchePcaetRepository,
    UpdateDemarchePcaetService,
    UpdateDemarchePcaetRouter,
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
