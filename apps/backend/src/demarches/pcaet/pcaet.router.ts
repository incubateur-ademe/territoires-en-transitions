import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ArchiverDemarchePcaetRouter } from './archiver-demarche/archiver-demarche.router';
import { CloreInstructionRouter } from './clore-instruction/clore-instruction.router';
import { CreateAndLinkPlanRouter } from './create-and-link-plan/create-and-link-plan.router';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { DeleteAvisRouter } from './delete-avis/delete-avis.router';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { DepublierDemarchePcaetRouter } from './depublier-demarche/depublier-demarche.router';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { EnvoyerAvisRouter } from './envoyer-avis/envoyer-avis.router';
import { GetAvisFileUrlRouter } from './get-avis-file-url/get-avis-file-url.router';
import { GetContexteInstructionRouter } from './get-contexte-instruction/get-contexte-instruction.router';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { GetDiagnosticInstructionRouter } from './get-diagnostic-instruction/get-diagnostic-instruction.router';
import { GetDossierDocumentUrlRouter } from './get-dossier-document-url/get-dossier-document-url.router';
import { GetDossierInstructionRouter } from './get-dossier-instruction/get-dossier-instruction.router';
import { ListAvisRecusRouter } from './list-avis-recus/list-avis-recus.router';
import { ListDemandesAvisRouter } from './list-demandes-avis/list-demandes-avis.router';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ListPlansRouter } from './list-plans/list-plans.router';
import { PublierDemarchePcaetRouter } from './publier-demarche/publier-demarche.router';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';
import { UpsertAvisRouter } from './upsert-avis/upsert-avis.router';
import { ValiderAvisRouter } from './valider-avis/valider-avis.router';

@Injectable()
export class PcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesPcaetRouter: ListDemarchesPcaetRouter,
    private readonly listDemandesAvisRouter: ListDemandesAvisRouter,
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
    private readonly envoyerAvisRouter: EnvoyerAvisRouter,
    private readonly getDemarchePcaetRouter: GetDemarchePcaetRouter,
    private readonly createDemarchePcaetRouter: CreateDemarchePcaetRouter,
    private readonly createAndLinkPlanRouter: CreateAndLinkPlanRouter,
    private readonly deleteDemarchePcaetRouter: DeleteDemarchePcaetRouter,
    private readonly updateDemarchePcaetRouter: UpdateDemarchePcaetRouter,
    private readonly transmettrePourAvisRouter: TransmettrePourAvisDemarchePcaetRouter,
    private readonly cloreInstructionRouter: CloreInstructionRouter,
    private readonly publierDemarchePcaetRouter: PublierDemarchePcaetRouter,
    private readonly depublierDemarchePcaetRouter: DepublierDemarchePcaetRouter,
    private readonly archiverDemarchePcaetRouter: ArchiverDemarchePcaetRouter,
    private readonly pcaetDiagnosticRouter: PcaetDiagnosticRouter,
    private readonly pcaetDocumentsRouter: PcaetDocumentsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDemarchesPcaetRouter.router,
    this.listDemandesAvisRouter.router,
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
    this.envoyerAvisRouter.router,
    this.getDemarchePcaetRouter.router,
    this.createDemarchePcaetRouter.router,
    this.createAndLinkPlanRouter.router,
    this.deleteDemarchePcaetRouter.router,
    this.updateDemarchePcaetRouter.router,
    this.transmettrePourAvisRouter.router,
    this.cloreInstructionRouter.router,
    this.publierDemarchePcaetRouter.router,
    this.depublierDemarchePcaetRouter.router,
    this.archiverDemarchePcaetRouter.router,

    this.trpc.router({
      diagnostic: this.pcaetDiagnosticRouter.router,
      documents: this.pcaetDocumentsRouter.router,
    })
  );
}
