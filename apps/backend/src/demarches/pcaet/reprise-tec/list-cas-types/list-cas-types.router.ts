import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listCasTypesErrorConfig } from './list-cas-types.errors';
import { ListCasTypesService } from './list-cas-types.service';

@Injectable()
export class ListCasTypesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listCasTypesService: ListCasTypesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listCasTypesErrorConfig
  );

  router = this.trpc.router({
    listCasTypes: this.trpc.authedProcedure.query(async ({ ctx }) =>
      this.getResultDataOrThrowError(
        await this.listCasTypesService.listCasTypes({ user: ctx.user })
      )
    ),
  });
}
