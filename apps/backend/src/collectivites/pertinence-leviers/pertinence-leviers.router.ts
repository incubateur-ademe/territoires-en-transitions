import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { listPertinencesLeviersInputSchema } from './list-pertinences-leviers/list-pertinences-leviers.input';
import { pertinencesLeviersSchema } from './list-pertinences-leviers/list-pertinences-leviers.output';
import { ListPertinencesLeviersService } from './list-pertinences-leviers/list-pertinences-leviers.service';
import { pertinenceLeviersErrorConfig } from './pertinence-leviers.trpc-errors';
import { upsertPertinenceLevierInputSchema } from './upsert-pertinence-levier/upsert-pertinence-levier.input';
import { UpsertPertinenceLevierService } from './upsert-pertinence-levier/upsert-pertinence-levier.service';

@Injectable()
export class PertinenceLeviersRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly listService: ListPertinencesLeviersService,
    private readonly upsertService: UpsertPertinenceLevierService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    pertinenceLeviersErrorConfig
  );

  router = this.trpc.router({
    list: this.trpc.authedProcedure
      .input(listPertinencesLeviersInputSchema)
      .output(pertinencesLeviersSchema)
      .query(async ({ input, ctx: { user } }) => {
        const pertinencesResult = await this.listService.listPertinences(
          input,
          { user }
        );
        return this.getResultDataOrThrowError(pertinencesResult);
      }),

    upsert: this.trpc.authedProcedure
      .input(upsertPertinenceLevierInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const upsertResult = await this.upsertService.upsertPertinence(input, {
          user,
        });
        return this.getResultDataOrThrowError(upsertResult);
      }),
  });
}
