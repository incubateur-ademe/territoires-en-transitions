import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { CreateUploadTokenRouter } from './create-upload-token/create-upload-token.router';
import { EditPreuveDocumentRouter } from './edit-preuve-document/edit-preuve-document.router';
import { GetDownloadUrlRouter } from './get-download-url/get-download-url.router';
import { StoreDocumentRouter } from './store-document/store-document.router';
import { UpdateDocumentRouter } from './update-document/update-document.router';

@Injectable()
export class DocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly storeDocumentRouter: StoreDocumentRouter,
    private readonly updateDocumentRouter: UpdateDocumentRouter,
    private readonly editPreuveDocumentRouter: EditPreuveDocumentRouter,
    private readonly createUploadTokenRouter: CreateUploadTokenRouter,
    private readonly getDownloadUrlRouter: GetDownloadUrlRouter
  ) {}

  router = this.trpc.mergeRouters(
    this.storeDocumentRouter.router,
    this.updateDocumentRouter.router,
    this.editPreuveDocumentRouter.router,
    this.createUploadTokenRouter.router,
    this.getDownloadUrlRouter.router
  );

  createCaller = this.trpc.createCallerFactory(this.router);
}
