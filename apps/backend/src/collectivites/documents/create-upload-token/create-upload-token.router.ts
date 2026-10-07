import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { createUploadTokenErrorConfig } from './create-upload-token.errors';
import { createUploadTokenInputSchema } from './create-upload-token.input';
import { createUploadTokenOutputSchema } from './create-upload-token.output';
import { CreateUploadTokenService } from './create-upload-token.service';

@Injectable()
export class CreateUploadTokenRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateUploadTokenService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    createUploadTokenErrorConfig
  );

  router = this.trpc.router({
    createUploadToken: this.trpc.authedProcedure
      .input(createUploadTokenInputSchema)
      .output(createUploadTokenOutputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.createUploadToken(input, {
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
