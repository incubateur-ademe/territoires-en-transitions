import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { panierActionsErrorConfig } from './actions.errors';
import {
  panierActionInputSchema,
  setActionStatusInputSchema,
} from './actions.input';
import { PanierActionsService } from './actions.service';

@Injectable()
export class PanierActionsRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: PanierActionsService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    panierActionsErrorConfig
  );

  router = this.trpc.router({
    actions: this.trpc.router({
      add: this.trpc.publicProcedure
        .input(panierActionInputSchema)
        .mutation(async ({ input }) => {
          const result = await this.service.addAction(input);
          return this.getResultDataOrThrowError(result);
        }),
      remove: this.trpc.publicProcedure
        .input(panierActionInputSchema)
        .mutation(async ({ input }) => {
          const result = await this.service.removeAction(input);
          return this.getResultDataOrThrowError(result);
        }),
      setStatus: this.trpc.publicProcedure
        .input(setActionStatusInputSchema)
        .mutation(async ({ input }) => {
          const result = await this.service.setStatus(input);
          return this.getResultDataOrThrowError(result);
        }),
      clearStatus: this.trpc.publicProcedure
        .input(panierActionInputSchema)
        .mutation(async ({ input }) => {
          const result = await this.service.clearStatus(input);
          return this.getResultDataOrThrowError(result);
        }),
    }),
  });
}
