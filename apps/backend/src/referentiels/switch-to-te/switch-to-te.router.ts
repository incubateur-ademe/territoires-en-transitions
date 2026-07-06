import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { switchToTeErrorConfig } from './switch-to-te.errors';
import { switchToTeInputSchema } from './switch-to-te.input';
import { SwitchToTeService } from './switch-to-te.service';

@Injectable()
export class SwitchToTeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly switchToTeService: SwitchToTeService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    switchToTeErrorConfig
  );

  switchToTe = this.trpc.authedProcedure
    .input(switchToTeInputSchema)
    .mutation(async ({ ctx: { user }, input: { collectiviteId } }) => {
      const result = await this.switchToTeService.switchToTe(collectiviteId, {
        user,
      });
      return this.getResultDataOrThrowError(result);
    });

  router = this.trpc.router({
    switchToTe: this.switchToTe,
  });
}
