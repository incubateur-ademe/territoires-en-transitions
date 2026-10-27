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
import { CompletePlanSecteursModule } from '@tet/backend/plans/fiches/fiche-secteurs/complete-plan-secteurs/complete-plan-secteurs.module';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { PlanModule } from '@tet/backend/plans/plans/plans.module';
import { UsersModule } from '@tet/backend/users/users.module';
import { NotificationsModule } from '@tet/backend/utils/notifications/notifications.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { TrackingModule } from '@tet/backend/utils/tracking/tracking.module';
import { AddVulnerabiliteThematiqueRouter } from './add-vulnerabilite-thematique/add-vulnerabilite-thematique.router';
import { AddVulnerabiliteThematiqueService } from './add-vulnerabilite-thematique/add-vulnerabilite-thematique.service';
import { ArchiverDemarchePcaetService } from './archiver-demarche/archiver-demarche.service';
import GetDemarcheUrlService from '@tet/backend/demarches/shared/get-demarche-url.service';
import { ListDestinatairesDemarcheService } from './notifications/list-destinataires-demarche.service';
import { NotifyAvisRecuService } from './notifications/notify-avis-recu/notify-avis-recu.service';
import { NotifyDossierTransmisService } from './notifications/notify-dossier-transmis/notify-dossier-transmis.service';
import { NotifyInstructionCloseService } from './notifications/notify-instruction-close/notify-instruction-close.service';
import { CloreInstructionRepository } from './clore-instruction/clore-instruction.repository';
import { CloreInstructionRouter } from './clore-instruction/clore-instruction.router';
import { CloreInstructionService } from './clore-instruction/clore-instruction.service';
import { CreateAndLinkPlanRouter } from './create-and-link-plan/create-and-link-plan.router';
import { CreateAndLinkPlanService } from './create-and-link-plan/create-and-link-plan.service';
import { GetDepotContextRouter } from './get-depot-context/get-depot-context.router';
import { GetDepotContextService } from './get-depot-context/get-depot-context.service';
import { CreateDemarchePcaetRepository } from './create-demarche-pcaet/create-demarche-pcaet.repository';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { CreateDemarchePcaetService } from './create-demarche-pcaet/create-demarche-pcaet.service';
import { AddDateSaisineRepository } from './add-date-saisine/add-date-saisine.repository';
import { AddDateSaisineRouter } from './add-date-saisine/add-date-saisine.router';
import { AddDateSaisineService } from './add-date-saisine/add-date-saisine.service';
import { ListDatesSaisineRepository } from './list-dates-saisine/list-dates-saisine.repository';
import { ListDatesSaisineRouter } from './list-dates-saisine/list-dates-saisine.router';
import { ListDatesSaisineService } from './list-dates-saisine/list-dates-saisine.service';
import { DeleteAvisRouter } from './delete-avis/delete-avis.router';
import { DeleteAvisService } from './delete-avis/delete-avis.service';
import { DeleteDemarchePcaetRepository } from './delete-demarche-pcaet/delete-demarche-pcaet.repository';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { DeleteDemarchePcaetService } from './delete-demarche-pcaet/delete-demarche-pcaet.service';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { SetDiagnosticReferenceYearRepository } from './diagnostic/set-diagnostic-reference-year/set-diagnostic-reference-year.repository';
import { SetDiagnosticReferenceYearRouter } from './diagnostic/set-diagnostic-reference-year/set-diagnostic-reference-year.router';
import { SetDiagnosticReferenceYearService } from './diagnostic/set-diagnostic-reference-year/set-diagnostic-reference-year.service';
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
import { ListContactsRouter } from './list-contacts/list-contacts.router';
import { ListContactsService } from './list-contacts/list-contacts.service';
import { AddReferentRouter } from './referents/add-referent/add-referent.router';
import { AddReferentService } from './referents/add-referent/add-referent.service';
import { GetReferentsAccessRouter } from './referents/get-referents-access/get-referents-access.router';
import { ListReferentsOrganismesRouter } from './referents/list-referents-organismes/list-referents-organismes.router';
import { ListReferentsOrganismesService } from './referents/list-referents-organismes/list-referents-organismes.service';
import { ListReferentsRegionsRouter } from './referents/list-referents-regions/list-referents-regions.router';
import { ListReferentsRegionsService } from './referents/list-referents-regions/list-referents-regions.service';
import { ReferentsPcaetPermissionsService } from './referents/referents-pcaet-permissions.service';
import { ReferentsPcaetRouter } from './referents/referents-pcaet.router';
import { ReferentsPcaetRepository } from './referents/referents-pcaet.repository';
import { RemoveReferentRouter } from './referents/remove-referent/remove-referent.router';
import { RemoveReferentService } from './referents/remove-referent/remove-referent.service';
import { ListAvisRecusService } from './list-avis-recus/list-avis-recus.service';
import { ListDossiersInstructionRepository } from './list-dossiers-instruction/list-dossiers-instruction.repository';
import { ListDossiersInstructionRouter } from './list-dossiers-instruction/list-dossiers-instruction.router';
import { ListDossiersInstructionService } from './list-dossiers-instruction/list-dossiers-instruction.service';
import { ListDemarchesPcaetRepository } from './list-demarches-pcaet/list-demarches-pcaet.repository';
import { ListPublicDemarchesPcaetRouter } from './list-public-demarches-pcaet/list-public-demarches-pcaet.router';
import { ListPublicDemarchesPcaetService } from './list-public-demarches-pcaet/list-public-demarches-pcaet.service';
import { GetPublicDemarchePcaetRouter } from './get-public-demarche-pcaet/get-public-demarche-pcaet.router';
import { GetPublicDemarchePcaetService } from './get-public-demarche-pcaet/get-public-demarche-pcaet.service';
import { GetPublicDiagnosticRouter } from './get-public-diagnostic/get-public-diagnostic.router';
import { GetPublicDiagnosticService } from './get-public-diagnostic/get-public-diagnostic.service';
import { DemarchePcaetPublicAccessService } from './shared/demarche-pcaet-public-access.service';
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
import { CollectiviteContactsRepository } from './shared/collectivite-contacts.repository';
import { DemarchePcaetAccessService } from './shared/demarche-pcaet-access.service';
import { DemarchePcaetDiagnosticService } from './shared/demarche-pcaet-diagnostic.service';
import { DemarchePcaetGuardsService } from './shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from './shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from './shared/demarche-pcaet-ref.repository';
import { DemarchePcaetSourceMetadonneeRepository } from './shared/demarche-pcaet-source-metadonnee.repository';
import { DemarchePcaetSuivantRepository } from './shared/demarche-pcaet-suivant.repository';
import { DemarchePcaetTransitionRepository } from './shared/demarche-pcaet-transition.repository';
import { DemarchePcaetTransitionService } from './shared/demarche-pcaet-transition.service';
import { DemarchePcaetVulnerabiliteReadService } from './shared/demarche-pcaet-vulnerabilite-read.service';
import { DemarchePcaetVulnerabiliteRepository } from './shared/demarche-pcaet-vulnerabilite.repository';
import { DepotPermissionsService } from './shared/depot-permissions.service';
import { PcaetAvisRepository } from './shared/pcaet-avis.repository';
import { PcaetInstructeursRepository } from './shared/pcaet-instructeurs.repository';
import { PerimetreInstructeurRepository } from './shared/perimetre-instructeur.repository';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { TransmettrePourAvisDemarchePcaetService } from './transmettre-pour-avis/transmettre-pour-avis.service';
import { UpdateDemarchePcaetRepository } from './update-demarche-pcaet/update-demarche-pcaet.repository';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpdateDemarchePcaetService } from './update-demarche-pcaet/update-demarche-pcaet.service';
import { UpdateVulnerabiliteThematiqueRouter } from './update-vulnerabilite-thematique/update-vulnerabilite-thematique.router';
import { UpdateVulnerabiliteThematiqueService } from './update-vulnerabilite-thematique/update-vulnerabilite-thematique.service';
import { DownloadDossierDocumentsController } from './download-dossier-documents/download-dossier-documents.controller';
import { DownloadDossierDocumentsService } from './download-dossier-documents/download-dossier-documents.service';
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
    CompletePlanSecteursModule,
    FichesModule,
    AxeModule,
    NotificationsModule,
    TrackingModule,
  ],
  controllers: [DownloadDossierDocumentsController],
  providers: [
    DownloadDossierDocumentsService,
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
    ArchiverDemarchePcaetService,
    DemarchePcaetSuivantRepository,
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
    DemarchePcaetSourceMetadonneeRepository,
    UpdateDiagnosticIndicateursValeursService,
    UpdateDiagnosticIndicateursValeursRouter,
    SetDiagnosticReferenceYearRepository,
    SetDiagnosticReferenceYearService,
    SetDiagnosticReferenceYearRouter,
    ListDemarchesPcaetRepository,
    ListDemarchesPcaetService,
    ListDemarchesPcaetRouter,
    DemarchePcaetPublicAccessService,
    ListPublicDemarchesPcaetService,
    ListPublicDemarchesPcaetRouter,
    GetPublicDemarchePcaetService,
    GetPublicDemarchePcaetRouter,
    GetPublicDiagnosticService,
    GetPublicDiagnosticRouter,
    ListDossiersInstructionRepository,
    ListDossiersInstructionService,
    ListDossiersInstructionRouter,
    CollectiviteContactsRepository,
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
    PerimetreInstructeurRepository,
    UpsertAvisService,
    UpsertAvisRouter,
    GetDemarcheUrlService,
    ListDestinatairesDemarcheService,
    NotifyAvisRecuService,
    NotifyDossierTransmisService,
    NotifyInstructionCloseService,
    ValiderAvisService,
    ValiderAvisRouter,
    DeleteAvisService,
    DeleteAvisRouter,
    AddDateSaisineService,
    AddDateSaisineRepository,
    AddDateSaisineRouter,
    ListDatesSaisineService,
    ListDatesSaisineRepository,
    ListDatesSaisineRouter,
    CreateDemarchePcaetRepository,
    CreateDemarchePcaetService,
    CreateDemarchePcaetRouter,
    GetDepotContextService,
    GetDepotContextRouter,
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
    ListContactsService,
    ListContactsRouter,
    ReferentsPcaetRepository,
    ReferentsPcaetPermissionsService,
    GetReferentsAccessRouter,
    ListReferentsRegionsService,
    ListReferentsRegionsRouter,
    ListReferentsOrganismesService,
    ListReferentsOrganismesRouter,
    AddReferentService,
    AddReferentRouter,
    RemoveReferentService,
    RemoveReferentRouter,
    ReferentsPcaetRouter,
    PcaetRouter,
  ],
  exports: [PcaetRouter],
})
export class PcaetModule {}
