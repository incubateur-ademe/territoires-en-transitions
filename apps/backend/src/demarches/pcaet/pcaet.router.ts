import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CloreInstructionRouter } from './clore-instruction/clore-instruction.router';
import { CreateAndLinkPlanRouter } from './create-and-link-plan/create-and-link-plan.router';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { DeleteAvisRouter } from './delete-avis/delete-avis.router';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { GetAvisFileUrlRouter } from './get-avis-file-url/get-avis-file-url.router';
import { GetContexteInstructionRouter } from './get-contexte-instruction/get-contexte-instruction.router';
import { GetDepotContextRouter } from './get-depot-context/get-depot-context.router';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { GetDiagnosticInstructionRouter } from './get-diagnostic-instruction/get-diagnostic-instruction.router';
import { GetDossierDocumentUrlRouter } from './get-dossier-document-url/get-dossier-document-url.router';
import { GetDossierInstructionRouter } from './get-dossier-instruction/get-dossier-instruction.router';
import { ListAvisRecusRouter } from './list-avis-recus/list-avis-recus.router';
import { ListDossiersInstructionRouter } from './list-dossiers-instruction/list-dossiers-instruction.router';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ListPublicDemarchesPcaetRouter } from './list-public-demarches-pcaet/list-public-demarches-pcaet.router';
import { GetPublicDemarchePcaetRouter } from './get-public-demarche-pcaet/get-public-demarche-pcaet.router';
import { GetPublicDiagnosticRouter } from './get-public-diagnostic/get-public-diagnostic.router';
import { ListContactsRouter } from './list-contacts/list-contacts.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { PublierDemarchePcaetRouter } from './publier-demarche/publier-demarche.router';
import { ReferentsPcaetRouter } from './referents/referents-pcaet.router';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpsertAvisRouter } from './upsert-avis/upsert-avis.router';
import { ValiderAvisRouter } from './valider-avis/valider-avis.router';

@Injectable()
export class PcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesPcaetRouter: ListDemarchesPcaetRouter,
    private readonly listPublicDemarchesPcaetRouter: ListPublicDemarchesPcaetRouter,
    private readonly getPublicDemarchePcaetRouter: GetPublicDemarchePcaetRouter,
    private readonly getPublicDiagnosticRouter: GetPublicDiagnosticRouter,
    private readonly listDossiersInstructionRouter: ListDossiersInstructionRouter,
    private readonly getDossierInstructionRouter: GetDossierInstructionRouter,
    private readonly getContexteInstructionRouter: GetContexteInstructionRouter,
    private readonly getAvisFileUrlRouter: GetAvisFileUrlRouter,
    private readonly listAvisRecusRouter: ListAvisRecusRouter,
    private readonly listPlansRouter: ListPlansRouter,
    private readonly getDossierDocumentUrlRouter: GetDossierDocumentUrlRouter,
    private readonly getDiagnosticInstructionRouter: GetDiagnosticInstructionRouter,
    private readonly upsertAvisRouter: UpsertAvisRouter,
    private readonly validerAvisRouter: ValiderAvisRouter,
    private readonly deleteAvisRouter: DeleteAvisRouter,
    private readonly getDemarchePcaetRouter: GetDemarchePcaetRouter,
    private readonly createDemarchePcaetRouter: CreateDemarchePcaetRouter,
    private readonly getDepotContextRouter: GetDepotContextRouter,
    private readonly createAndLinkPlanRouter: CreateAndLinkPlanRouter,
    private readonly deleteDemarchePcaetRouter: DeleteDemarchePcaetRouter,
    private readonly updateDemarchePcaetRouter: UpdateDemarchePcaetRouter,
    private readonly transmettrePourAvisRouter: TransmettrePourAvisDemarchePcaetRouter,
    private readonly cloreInstructionRouter: CloreInstructionRouter,
    private readonly publierDemarchePcaetRouter: PublierDemarchePcaetRouter,
    private readonly pcaetDiagnosticRouter: PcaetDiagnosticRouter,
    private readonly pcaetDocumentsRouter: PcaetDocumentsRouter,
    private readonly listContactsRouter: ListContactsRouter,
    private readonly referentsPcaetRouter: ReferentsPcaetRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDemarchesPcaetRouter.router,
    this.listPublicDemarchesPcaetRouter.router,
    this.getPublicDemarchePcaetRouter.router,
    this.getPublicDiagnosticRouter.router,
    this.listDossiersInstructionRouter.router,
    this.getDossierInstructionRouter.router,
    this.getContexteInstructionRouter.router,
    this.getAvisFileUrlRouter.router,
    this.listAvisRecusRouter.router,
    this.listPlansRouter.router,
    this.getDossierDocumentUrlRouter.router,
    this.getDiagnosticInstructionRouter.router,
    this.upsertAvisRouter.router,
    this.validerAvisRouter.router,
    this.deleteAvisRouter.router,
    this.getDemarchePcaetRouter.router,
    this.createDemarchePcaetRouter.router,
    this.getDepotContextRouter.router,
    this.createAndLinkPlanRouter.router,
    this.deleteDemarchePcaetRouter.router,
    this.updateDemarchePcaetRouter.router,
    this.transmettrePourAvisRouter.router,
    this.cloreInstructionRouter.router,
    this.publierDemarchePcaetRouter.router,
    this.listContactsRouter.router,

    this.trpc.router({
      diagnostic: this.pcaetDiagnosticRouter.router,
      documents: this.pcaetDocumentsRouter.router,
      referents: this.referentsPcaetRouter.router,
    })
  );
}
