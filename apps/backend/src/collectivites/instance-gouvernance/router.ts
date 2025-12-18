import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  createInstanceGouvernanceRequestSchema,
  deleteInstanceGouvernanceRequestSchema,
  listInstanceGouvernanceRequestSchema,
  updateInstanceGouvernanceRequestSchema,
} from './request';
import { InstanceGouvernanceService } from './service';

@Injectable()
export class InstanceGouvernanceRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly instanceGouvernanceService: InstanceGouvernanceService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createInstanceGouvernanceRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.create({
          ...input,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
    list: this.trpc.authedProcedure
      .input(listInstanceGouvernanceRequestSchema)
      .query(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.list({
          collectiviteId: input.collectiviteId,
          user: ctx.user,
        });
        return this.getResultDataOrThrowError(result);
      }),
    delete: this.trpc.authedProcedure
      .input(deleteInstanceGouvernanceRequestSchema)
      .mutation(async ({ input, ctx }) => {
        const result = await this.instanceGouvernanceService.delete({
          id: input.id,
          user: ctx.user,
          collectiviteId: input.collectiviteId,
        });
        return this.getResultDataOrThrowError(result);
      }),
    update: this.trpc.authedProcedure
      .input(updateInstanceGouvernanceRequestSchema)
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
