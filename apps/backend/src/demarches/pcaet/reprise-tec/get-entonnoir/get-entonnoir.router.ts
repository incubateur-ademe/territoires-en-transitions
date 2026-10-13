import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getEntonnoirErrorConfig } from './get-entonnoir.errors';
import { GetEntonnoirService } from './get-entonnoir.service';

@Injectable()
export class GetEntonnoirRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getEntonnoirService: GetEntonnoirService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getEntonnoirErrorConfig
  );

  router = this.trpc.router({
    getEntonnoir: this.trpc.authedProcedure.query(async ({ ctx }) =>
      this.getResultDataOrThrowError(
        await this.getEntonnoirService.getEntonnoir({ user: ctx.user })
      )
    ),
  });
}
