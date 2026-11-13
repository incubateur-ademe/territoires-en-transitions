import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { electrificationDataErrorConfig } from './electrification-data.errors';
import {
  getElectrificationDataInputSchema,
  publishElectrificationDataInputSchema,
  verifyElectrificationDataOutputSchema,
  prepareElectrificationDataInputSchema,
} from './publish-electrification-data.input';
import { PublishElectrificationDataService } from './publish-electrification-data.service';

@Injectable()
export class PublishElectrificationDataRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly publication: PublishElectrificationDataService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    electrificationDataErrorConfig
  );

  router = this.trpc.router({
    electrificationData: this.trpc.router({
      prepare: this.trpc.authedProcedure
        .input(prepareElectrificationDataInputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.publication.prepare(input, { user })
          )
        ),
      get: this.trpc.authedProcedure
        .input(getElectrificationDataInputSchema)
        .query(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.publication.get(input, { user })
          )
        ),
      verify: this.trpc.authedProcedure
        .input(publishElectrificationDataInputSchema)
        .output(verifyElectrificationDataOutputSchema)
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.publication.verify(input, { user })
          )
        ),
      publish: this.trpc.authedProcedure
        .input(publishElectrificationDataInputSchema)
        .output(z.object({ version: z.string() }))
        .mutation(async ({ input, ctx: { user } }) =>
          this.getResultDataOrThrowError(
            await this.publication.publish(input, { user })
          )
        ),
    }),
  });
}
