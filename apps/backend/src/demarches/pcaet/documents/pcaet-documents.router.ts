import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { AddDemarchePcaetDocumentRouter } from './add-document/add-document.router';
import { CreateDemarchePcaetDocumentAdditionalRouter } from './create-document-additional/create-document-additional.router';
import { ListDemarchePcaetDocumentsRouter } from './list-documents/list-documents.router';
import { RemoveDemarchePcaetDocumentAdditionalRouter } from './remove-document-additional/remove-document-additional.router';
import { RemoveDemarchePcaetDocumentRouter } from './remove-document/remove-document.router';
import { SetDemarchePcaetDocumentCouvertureRouter } from './set-document-couverture/set-document-couverture.router';
import { UpdateDemarchePcaetDocumentAdditionalRouter } from './update-document-additional/update-document-additional.router';

@Injectable()
export class PcaetDocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDemarchePcaetDocumentsRouter: ListDemarchePcaetDocumentsRouter,
    private readonly addDemarchePcaetDocumentRouter: AddDemarchePcaetDocumentRouter,
    private readonly removeDemarchePcaetDocumentRouter: RemoveDemarchePcaetDocumentRouter,
    private readonly setDemarchePcaetDocumentCouvertureRouter: SetDemarchePcaetDocumentCouvertureRouter,
    private readonly createDemarchePcaetDocumentAdditionalRouter: CreateDemarchePcaetDocumentAdditionalRouter,
    private readonly updateDemarchePcaetDocumentAdditionalRouter: UpdateDemarchePcaetDocumentAdditionalRouter,
    private readonly removeDemarchePcaetDocumentAdditionalRouter: RemoveDemarchePcaetDocumentAdditionalRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.listDemarchePcaetDocumentsRouter.router,
    this.addDemarchePcaetDocumentRouter.router,
    this.removeDemarchePcaetDocumentRouter.router,
    this.setDemarchePcaetDocumentCouvertureRouter.router,
    this.createDemarchePcaetDocumentAdditionalRouter.router,
    this.updateDemarchePcaetDocumentAdditionalRouter.router,
    this.removeDemarchePcaetDocumentAdditionalRouter.router
  );
}
