import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { StoreDocumentRouter } from './store-document/store-document.router';

@Injectable()
export class DocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly storeDocumentRouter: StoreDocumentRouter
  ) {}

  router = this.trpc.mergeRouters(this.storeDocumentRouter.router);

  createCaller = this.trpc.createCallerFactory(this.router);
}
