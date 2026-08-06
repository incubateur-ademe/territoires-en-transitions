import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ApplyTransitionRouter } from './apply-transition/apply-transition.router';
import { CreateDemarchePcaetRouter } from './create-demarche-pcaet/create-demarche-pcaet.router';
import { DeleteDemarchePcaetRouter } from './delete-demarche-pcaet/delete-demarche-pcaet.router';
import { PcaetDocumentsRouter } from './documents/pcaet-documents.router';
import { GetDemarchePcaetRouter } from './get-demarche-pcaet/get-demarche-pcaet.router';
import { ListDemarchesPcaetRouter } from './list-demarches-pcaet/list-demarches-pcaet.router';
import { SetPublicationStatusRouter } from './set-publication-status/set-publication-status.router';
import { UpdateDemarchePcaetRouter } from './update-demarche-pcaet/update-demarche-pcaet.router';

@Injectable()
export class PcaetRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchesPcaetRouter: ListDemarchesPcaetRouter,
    private readonly getDemarchePcaetRouter: GetDemarchePcaetRouter,
    private readonly createDemarchePcaetRouter: CreateDemarchePcaetRouter,
    private readonly deleteDemarchePcaetRouter: DeleteDemarchePcaetRouter,
    private readonly updateDemarchePcaetRouter: UpdateDemarchePcaetRouter,
    private readonly setPublicationStatusRouter: SetPublicationStatusRouter,
    private readonly applyTransitionRouter: ApplyTransitionRouter,
    private readonly pcaetDocumentsRouter: PcaetDocumentsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDemarchesPcaetRouter.router,
    this.getDemarchePcaetRouter.router,
    this.createDemarchePcaetRouter.router,
    this.deleteDemarchePcaetRouter.router,
    this.updateDemarchePcaetRouter.router,
    this.setPublicationStatusRouter.router,
    this.applyTransitionRouter.router,
    this.trpc.router({ documents: this.pcaetDocumentsRouter.router })
  );
}
