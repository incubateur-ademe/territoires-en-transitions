import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { TransmettrePourAvisDemarchePcaetRouter } from './transmettre-pour-avis/transmettre-pour-avis.router';
import { ReprendreElaborationDemarchePcaetRouter } from './reprendre-elaboration/reprendre-elaboration.router';
import { AdopterDemarchePcaetRouter } from './adopter-demarche/adopter-demarche.router';
import { PublierDemarchePcaetRouter } from './publier-demarche/publier-demarche.router';
import { DepublierDemarchePcaetRouter } from './depublier-demarche/depublier-demarche.router';
import { ArchiverDemarchePcaetRouter } from './archiver-demarche/archiver-demarche.router';
import { CreateAndLinkPlanRouter } from './create-and-link-plan/create-and-link-plan.router';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { PcaetDiagnosticRouter } from './diagnostic/pcaet-diagnostic.router';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { GetDossierInstructionRouter } from './get-dossier-instruction/get-dossier-instruction.router';
import { ListDemandesAvisRouter } from './list-demandes-avis/list-demandes-avis.router';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { ValiderPartieInstructionRouter } from './valider-partie-instruction/valider-partie-instruction.router';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';

@Injectable()
export class PcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesPcaetRouter: ListDemarchesPcaetRouter,
    private readonly listDemandesAvisRouter: ListDemandesAvisRouter,
    private readonly getDossierInstructionRouter: GetDossierInstructionRouter,
    private readonly validerPartieInstructionRouter: ValiderPartieInstructionRouter,
    private readonly getDemarchePcaetRouter: GetDemarchePcaetRouter,
    private readonly createDemarchePcaetRouter: CreateDemarchePcaetRouter,
    private readonly createAndLinkPlanRouter: CreateAndLinkPlanRouter,
    private readonly deleteDemarchePcaetRouter: DeleteDemarchePcaetRouter,
    private readonly updateDemarchePcaetRouter: UpdateDemarchePcaetRouter,
    private readonly transmettrePourAvisRouter: TransmettrePourAvisDemarchePcaetRouter,
    private readonly reprendreElaborationRouter: ReprendreElaborationDemarchePcaetRouter,
    private readonly adopterDemarchePcaetRouter: AdopterDemarchePcaetRouter,
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
    this.validerPartieInstructionRouter.router,
    this.getDemarchePcaetRouter.router,
    this.createDemarchePcaetRouter.router,
    this.createAndLinkPlanRouter.router,
    this.deleteDemarchePcaetRouter.router,
    this.updateDemarchePcaetRouter.router,
    this.transmettrePourAvisRouter.router,
    this.reprendreElaborationRouter.router,
    this.adopterDemarchePcaetRouter.router,
    this.publierDemarchePcaetRouter.router,
    this.depublierDemarchePcaetRouter.router,
    this.archiverDemarchePcaetRouter.router,
    this.trpc.router({ diagnostic: this.pcaetDiagnosticRouter.router }),
    this.trpc.router({ documents: this.pcaetDocumentsRouter.router })
  );
}
