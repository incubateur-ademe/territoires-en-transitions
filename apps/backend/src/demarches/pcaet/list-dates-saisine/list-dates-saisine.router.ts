import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listDatesSaisineErrorConfig } from './list-dates-saisine.errors';
import { listDatesSaisineInputSchema } from './list-dates-saisine.input';
import { ListDatesSaisineService } from './list-dates-saisine.service';

@Injectable()
export class ListDatesSaisineRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listDatesSaisineService: ListDatesSaisineService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listDatesSaisineErrorConfig
  );

  router = this.trpc.router({
    listDatesSaisine: this.trpc.authedProcedure
      .input(listDatesSaisineInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.listDatesSaisineService.listDatesSaisine(
          input,
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
