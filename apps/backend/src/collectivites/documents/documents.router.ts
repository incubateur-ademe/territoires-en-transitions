import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { EditPreuveDocumentRouter } from './edit-preuve-document/edit-preuve-document.router';
import { ListDocumentsRouter } from './list-documents/list-documents.router';
import { StoreDocumentRouter } from './store-document/store-document.router';
import { UpdateDocumentRouter } from './update-document/update-document.router';

@Injectable()
export class DocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly storeDocumentRouter: StoreDocumentRouter,
    private readonly updateDocumentRouter: UpdateDocumentRouter,
    private readonly editPreuveDocumentRouter: EditPreuveDocumentRouter,
    private readonly listDocumentsRouter: ListDocumentsRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.storeDocumentRouter.router,
    this.updateDocumentRouter.router,
    this.editPreuveDocumentRouter.router,
    this.listDocumentsRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
