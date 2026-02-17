import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { StoreDocumentRouter } from './store-document/store-document.router';
import { UpdateDocumentRouter } from './update-document/update-document.router';

@Injectable()
export class DocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly storeDocumentRouter: StoreDocumentRouter,
    private readonly updateDocumentRouter: UpdateDocumentRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.storeDocumentRouter.router,
    this.updateDocumentRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
