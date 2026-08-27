import { Module } from '@nestjs/common';
import { CollectivitesCoreModule } from '@tet/backend/collectivites/collectivites-core.module';
import { PersonnalisationsModule } from '@tet/backend/collectivites/personnalisations/personnalisations.module';
import { DemarcheDocumentApplicabiliteService } from '@tet/backend/demarches/shared/demarche-document-applicabilite.service';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarcheHistoriqueRepository } from '@tet/backend/demarches/shared/demarche-historique.repository';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { DemarchePlansContenuRepository } from '@tet/backend/demarches/shared/demarche-plans-contenu.repository';
import { IndicateursModule } from '@tet/backend/indicateurs/indicateurs.module';
import { AxeModule } from '@tet/backend/plans/axes/axe.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { AddVulnerabiliteThematiqueRouter } from './add-vulnerabilite-thematique/add-vulnerabilite-thematique.router';
import { AddVulnerabiliteThematiqueService } from './add-vulnerabilite-thematique/add-vulnerabilite-thematique.service';
import { ArchiverDemarchePcaetRouter } from './archiver-demarche/archiver-demarche.router';
import { ArchiverDemarchePcaetService } from './archiver-demarche/archiver-demarche.service';
import { CloreInstructionRepository } from './clore-instruction/clore-instruction.repository';
import { CloreInstructionRouter } from './clore-instruction/clore-instruction.router';
import { CloreInstructionService } from './clore-instruction/clore-instruction.service';
import { CreateAndLinkPlanRouter } from './create-and-link-plan/create-and-link-plan.router';
import { CreateAndLinkPlanService } from './create-and-link-plan/create-and-link-plan.service';
import { CreateDemarchePcaetRepository } from './create-demarche-pcaet/create-demarche-pcaet.repository';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { CreateDemarchePcaetService } from './create-demarche-pcaet/create-demarche-pcaet.service';
import { DeleteAvisRouter } from './delete-avis/delete-avis.router';
import { DeleteAvisService } from './delete-avis/delete-avis.service';
import { DeleteDemarchePcaetRepository } from './delete-demarche-pcaet/delete-demarche-pcaet.repository';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { DeleteDemarchePcaetService } from './delete-demarche-pcaet/delete-demarche-pcaet.service';
import { DepublierDemarchePcaetRouter } from './depublier-demarche/depublier-demarche.router';
import { DepublierDemarchePcaetService } from './depublier-demarche/depublier-demarche.service';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { UpdateDiagnosticIndicateursValeursRouter } from './diagnostic/update-diagnostic-indicateurs-valeurs/update-diagnostic-indicateurs-valeurs.router';
import { UpdateDiagnosticIndicateursValeursService } from './diagnostic/update-diagnostic-indicateurs-valeurs/update-diagnostic-indicateurs-valeurs.service';
import { AddDemarchePcaetDocumentRouter } from './documents/add-document/add-document.router';
import { AddDemarchePcaetDocumentService } from './documents/add-document/add-document.service';
import { CreateDemarchePcaetDocumentAdditionalRouter } from './documents/create-document-additional/create-document-additional.router';
import { CreateDemarchePcaetDocumentAdditionalService } from './documents/create-document-additional/create-document-additional.service';
import { ListDemarchePcaetDocumentsRouter } from './documents/list-documents/list-documents.router';
import { ListDemarchePcaetDocumentsService } from './documents/list-documents/list-documents.service';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { RemoveDemarchePcaetDocumentAdditionalRouter } from './documents/remove-document-additional/remove-document-additional.router';
import { RemoveDemarchePcaetDocumentAdditionalService } from './documents/remove-document-additional/remove-document-additional.service';
import { RemoveDemarchePcaetDocumentRouter } from './documents/remove-document/remove-document.router';
import { RemoveDemarchePcaetDocumentService } from './documents/remove-document/remove-document.service';
import { SetDemarchePcaetDocumentCouvertureRouter } from './documents/set-document-couverture/set-document-couverture.router';
import { SetDemarchePcaetDocumentCouvertureService } from './documents/set-document-couverture/set-document-couverture.service';
import { UpdateDemarchePcaetDocumentAdditionalRouter } from './documents/update-document-additional/update-document-additional.router';
import { UpdateDemarchePcaetDocumentAdditionalService } from './documents/update-document-additional/update-document-additional.service';
import { EnvoyerAvisRouter } from './envoyer-avis/envoyer-avis.router';
import { EnvoyerAvisService } from './envoyer-avis/envoyer-avis.service';
import { GetAvisFileUrlRouter } from './get-avis-file-url/get-avis-file-url.router';
import { GetAvisFileUrlService } from './get-avis-file-url/get-avis-file-url.service';
import { GetContexteInstructionRouter } from './get-contexte-instruction/get-contexte-instruction.router';
import { GetContexteInstructionService } from './get-contexte-instruction/get-contexte-instruction.service';
import { GetDemarchePcaetRepository } from './get-demarche-pcaet/get-demarche-pcaet.repository';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { GetDemarchePcaetService } from './get-demarche-pcaet/get-demarche-pcaet.service';
import { GetDiagnosticInstructionRouter } from './get-diagnostic-instruction/get-diagnostic-instruction.router';
import { GetDiagnosticInstructionService } from './get-diagnostic-instruction/get-diagnostic-instruction.service';
import { GetDiagnosticRouter } from './get-diagnostic/get-diagnostic.router';
import { GetDiagnosticService } from './get-diagnostic/get-diagnostic.service';
import { GetDossierDocumentUrlRouter } from './get-dossier-document-url/get-dossier-document-url.router';
import { GetDossierDocumentUrlService } from './get-dossier-document-url/get-dossier-document-url.service';
import { GetDossierInstructionRouter } from './get-dossier-instruction/get-dossier-instruction.router';
import { GetDossierInstructionService } from './get-dossier-instruction/get-dossier-instruction.service';
import { ListAvisRecusRouter } from './list-avis-recus/list-avis-recus.router';
import { ListAvisRecusService } from './list-avis-recus/list-avis-recus.service';
import { ListDemandesAvisRepository } from './list-demandes-avis/list-demandes-avis.repository';
import { ListDemandesAvisRouter } from './list-demandes-avis/list-demandes-avis.router';
import { ListDemandesAvisService } from './list-demandes-avis/list-demandes-avis.service';
import { ListDemarchesPcaetRepository } from './list-demarches-pcaet/list-demarches-pcaet.repository';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ListDemarchesPcaetService } from './list-demarches-pcaet/list-demarches-pcaet.service';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { ListPlansService } from './list-plans/list-plans.service';
import { PcaetRouter } from './pcaet.router';
import { PublierDemarchePcaetRouter } from './publier-demarche/publier-demarche.router';
import { PublierDemarchePcaetService } from './publier-demarche/publier-demarche.service';
import { RemoveVulnerabiliteThematiqueRouter } from './remove-vulnerabilite-thematique/remove-vulnerabilite-thematique.router';
import { RemoveVulnerabiliteThematiqueService } from './remove-vulnerabilite-thematique/remove-vulnerabilite-thematique.service';
import { SetVulnerabiliteLigneRouter } from './set-vulnerabilite-ligne/set-vulnerabilite-ligne.router';
import { SetVulnerabiliteLigneService } from './set-vulnerabilite-ligne/set-vulnerabilite-ligne.service';
import { DemarchePcaetAccessService } from './shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from './shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetGuardsService } from './shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from './shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from './shared/demarche-pcaet-ref.repository';
import { DemarchePcaetTransitionRepository } from './shared/demarche-pcaet-transition.repository';
import { DemarchePcaetTransitionService } from './shared/demarche-pcaet-transition.service';
import { DemarchePcaetVulnerabiliteReadService } from './shared/demarche-pcaet-vulnerabilite-read.service';
import { DemarchePcaetVulnerabiliteRepository } from './shared/demarche-pcaet-vulnerabilite.repository';
import { DepotPermissionsService } from './shared/depot-permissions.service';
import { PcaetAvisRepository } from './shared/pcaet-avis.repository';
import { PcaetInstructeursRepository } from './shared/pcaet-instructeurs.repository';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { TransmettrePourAvisDemarchePcaetService } from './transmettre-pour-avis/transmettre-pour-avis.service';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet/update-demarche-pcaet.repository';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpdateDemarchePcaetService } from './update-demarche-pcaet/update-demarche-pcaet.service';
import { UpdateVulnerabiliteThematiqueRouter } from './update-vulnerabilite-thematique/update-vulnerabilite-thematique.router';
import { UpdateVulnerabiliteThematiqueService } from './update-vulnerabilite-thematique/update-vulnerabilite-thematique.service';
import { UpsertAvisRouter } from './upsert-avis/upsert-avis.router';
import { UpsertAvisService } from './upsert-avis/upsert-avis.service';
import { ValiderAvisRouter } from './valider-avis/valider-avis.router';
import { ValiderAvisService } from './valider-avis/valider-avis.service';

@Module({
  imports: [
    UsersModule,
    // Le catalogue documentaire est conditionné à l'identité de la collectivité
    // et à ses réponses de personnalisation.
    CollectivitesCoreModule,
    PersonnalisationsModule,
    TransactionModule,
    IndicateursModule,
    PlanModule,
    AxeModule,
    NotificationsModule,
  ],
  providers: [
    DemarchePcaetPilotesRepository,
    DemarchePcaetGuardsService,
    DemarchePcaetTransitionService,
    DemarchePcaetTransitionRepository,
    TransmettrePourAvisDemarchePcaetService,
    TransmettrePourAvisDemarchePcaetRouter,
    CloreInstructionService,
    CloreInstructionRepository,
    CloreInstructionRouter,
    PublierDemarchePcaetService,
    PublierDemarchePcaetRouter,
    DepublierDemarchePcaetService,
    DepublierDemarchePcaetRouter,
    ArchiverDemarchePcaetService,
    ArchiverDemarchePcaetRouter,
    DepotPermissionsService,
    DemarchePcaetRefRepository,
    DemarcheDocumentApplicabiliteService,
    DemarcheHistoriqueRepository,
    DemarcheDocumentsRepository,
    DemarchePlanActionsRepository,
    GetDemarchePcaetRepository,
    GetDemarchePcaetService,
    GetDemarchePcaetRouter,
    DemarchePcaetVulnerabiliteReadService,
    DemarchePcaetDiagnosticService,
    GetDiagnosticService,
    GetDiagnosticRouter,
    DemarchePcaetVulnerabiliteRepository,
    DemarchePcaetAccessService,
    SetVulnerabiliteLigneService,
    SetVulnerabiliteLigneRouter,
    AddVulnerabiliteThematiqueService,
    AddVulnerabiliteThematiqueRouter,
    UpdateVulnerabiliteThematiqueService,
    UpdateVulnerabiliteThematiqueRouter,
    RemoveVulnerabiliteThematiqueService,
    RemoveVulnerabiliteThematiqueRouter,
    PcaetDiagnosticRouter,
    UpdateDiagnosticIndicateursValeursService,
    UpdateDiagnosticIndicateursValeursRouter,
    ListDemarchesPcaetRepository,
    ListDemarchesPcaetService,
    ListDemarchesPcaetRouter,
    ListDemandesAvisRepository,
    ListDemandesAvisService,
    ListDemandesAvisRouter,
    GetDossierInstructionService,
    ListAvisRecusService,
    ListAvisRecusRouter,
    ListPlansService,
    ListPlansRouter,
    GetAvisFileUrlService,
    GetAvisFileUrlRouter,
    DemarchePlansContenuRepository,
    GetDossierInstructionRouter,
    GetContexteInstructionService,
    GetContexteInstructionRouter,
    GetDiagnosticInstructionService,
    GetDiagnosticInstructionRouter,
    GetDossierDocumentUrlService,
    GetDossierDocumentUrlRouter,
    PcaetAvisRepository,
    PcaetInstructeursRepository,
    UpsertAvisService,
    UpsertAvisRouter,
    ValiderAvisService,
    ValiderAvisRouter,
    DeleteAvisService,
    DeleteAvisRouter,
    EnvoyerAvisService,
    EnvoyerAvisRouter,
    CreateDemarchePcaetRepository,
    CreateDemarchePcaetService,
    CreateDemarchePcaetRouter,
    DeleteDemarchePcaetRepository,
    DeleteDemarchePcaetService,
    DeleteDemarchePcaetRouter,
    UpdateDemarchePcaetRepository,
    UpdateDemarchePcaetService,
    UpdateDemarchePcaetRouter,
    CreateAndLinkPlanService,
    CreateAndLinkPlanRouter,
    ListDemarchePcaetDocumentsService,
    ListDemarchePcaetDocumentsRouter,
    AddDemarchePcaetDocumentService,
    AddDemarchePcaetDocumentRouter,
    RemoveDemarchePcaetDocumentService,
    RemoveDemarchePcaetDocumentRouter,
    CreateDemarchePcaetDocumentAdditionalService,
    CreateDemarchePcaetDocumentAdditionalRouter,
    UpdateDemarchePcaetDocumentAdditionalService,
    UpdateDemarchePcaetDocumentAdditionalRouter,
    RemoveDemarchePcaetDocumentAdditionalService,
    RemoveDemarchePcaetDocumentAdditionalRouter,
    SetDemarchePcaetDocumentCouvertureService,
    SetDemarchePcaetDocumentCouvertureRouter,
    PcaetDocumentsRouter,
    PcaetRouter,
  ],
  exports: [PcaetRouter],
})
export class PcaetModule {}
