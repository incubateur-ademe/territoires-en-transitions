import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { instanceGouvernanceErrorConfig } from './handle-instance-gouvernance.errors';
import {
  createInstanceGouvernanceInputSchema,
  deleteInstanceGouvernanceInputSchema,
  listInstanceGouvernanceInputSchema,
  updateInstanceGouvernanceInputSchema,
} from './handle-instance-gouvernance.input';
import { InstanceGouvernanceService } from './handle-instance-gouvernance.service';

@Injectable()
export class InstanceGouvernanceRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly instanceGouvernanceService: InstanceGouvernanceService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    instanceGouvernanceErrorConfig
  );

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createInstanceGouvernanceInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.create({
          nom: input.nom,
          collectiviteId: input.collectiviteId,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
    list: this.trpc.authedProcedure
      .input(listInstanceGouvernanceInputSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.list({
          collectiviteId: input.collectiviteId,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
    delete: this.trpc.authedProcedure
      .input(deleteInstanceGouvernanceInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.delete({
          id: input.id,
          user: ctx.user,
          collectiviteId: input.collectiviteId,
        });
        return this.getResultDataOrThrowError(result);
      }),
    update: this.trpc.authedProcedure
      .input(updateInstanceGouvernanceInputSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.update({
          id: input.id,
          user: ctx.user,
          collectiviteId: input.collectiviteId,
          nom: input.nom,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
