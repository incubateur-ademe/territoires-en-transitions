import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import z from 'zod';
import { listFichesErrorConfig } from './list-fiches.errors';
import { listFichesInputSchema } from './list-fiches.request';
import ListFichesService from './list-fiches.service';

@Injectable()
export class ListFichesRouter {
  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    listFichesErrorConfig
  );

  constructor(
    private readonly trpc: TrpcService,
    private readonly service: ListFichesService
  ) {}

  router = this.trpc.router({
    get: this.trpc.authedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const result = await this.service.getFicheById(
          { ficheId: input.id },
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),

    listFiches: this.trpc.authedProcedure
      .input(listFichesInputSchema)
      .query(async ({ input, ctx }) => {
        const { collectiviteId, filters, queryOptions } = input;

        const result = await this.service.getFichesActionResumes(
          {
            collectiviteId,
            filters: filters ?? {},
            queryOptions,
            readsMaskedFields: false,
          },
          { user: ctx.user }
        );
        return this.getResultDataOrThrowError(result);
      }),
  });
}
