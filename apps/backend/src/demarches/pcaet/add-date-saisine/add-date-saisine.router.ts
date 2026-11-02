import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { addDateSaisineErrorConfig } from './add-date-saisine.errors';
import { addDateSaisineInputSchema } from './add-date-saisine.input';
import { AddDateSaisineService } from './add-date-saisine.service';

@Injectable()
export class AddDateSaisineRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly addDateSaisineService: AddDateSaisineService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    addDateSaisineErrorConfig
  );

  router = this.trpc.router({
    addDateSaisine: this.trpc.authedProcedure
      .input(addDateSaisineInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.addDateSaisineService.addDateSaisine(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
