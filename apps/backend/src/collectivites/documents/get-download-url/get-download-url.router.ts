import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { getDownloadUrlErrorConfig } from './get-download-url.errors';
import { getDownloadUrlInputSchema } from './get-download-url.input';
import { getDownloadUrlOutputSchema } from './get-download-url.output';
import { GetDownloadUrlService } from './get-download-url.service';

@Injectable()
export class GetDownloadUrlRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: GetDownloadUrlService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    getDownloadUrlErrorConfig
  );

  router = this.trpc.router({
    getDownloadUrl: this.trpc.authedProcedure
      .input(getDownloadUrlInputSchema)
      .output(getDownloadUrlOutputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.getDownloadUrl(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
