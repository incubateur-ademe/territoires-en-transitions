import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getAvisFileUrlErrorConfig } from './get-avis-file-url.errors';
import { getAvisFileUrlInputSchema } from './get-avis-file-url.input';
import { GetAvisFileUrlService } from './get-avis-file-url.service';

@Injectable()
export class GetAvisFileUrlRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly getAvisFileUrlService: GetAvisFileUrlService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getAvisFileUrlErrorConfig
  );

  router = this.trpc.router({
    getAvisFileUrl: this.trpc.authedProcedure
      .input(getAvisFileUrlInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.getAvisFileUrlService.getAvisFileUrl(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
