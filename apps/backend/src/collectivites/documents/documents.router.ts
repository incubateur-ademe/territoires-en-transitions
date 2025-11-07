import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import { CreateDocumentRouter } from './create-document/create-document.router';

@Injectable()
export class DocumentsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly createDocumentRouter: CreateDocumentRouter
  ) {}

  router = this.trpc.mergeRouters(this.createDocumentRouter.router);

  createCaller = this.trpc.createCallerFactory(this.router);
}
