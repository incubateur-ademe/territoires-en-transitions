import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { switchToTeStatusOutputSchema } from './get-switch-to-te-status.output';
import { RepairSwitchToTeStatutsService } from './repair-switch-to-te-statuts/repair-switch-to-te-statuts.service';
import { switchToTeErrorConfig } from './switch-to-te.errors';
import { switchToTeInputSchema } from './switch-to-te.input';
import { SwitchToTeService } from './switch-to-te.service';

@Injectable()
export class SwitchToTeRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly switchToTeService: SwitchToTeService,
    private readonly repairSwitchToTeStatutsService: RepairSwitchToTeStatutsService
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

  getSwitchToTeStatus = this.trpc.authedProcedure
    .input(switchToTeInputSchema)
    .output(switchToTeStatusOutputSchema)
    .query(async ({ ctx: { user }, input: { collectiviteId } }) => {
      const result = await this.switchToTeService.getSwitchToTeStatus(
        collectiviteId,
        { user }
      );
      return this.getResultDataOrThrowError(result);
    });

  // Rattrapage ponctuel (TET-8147) des collectivités basculées avant le
  // correctif : à retirer une fois exécuté en production. Une collectivité par
  // appel, en dry-run par défaut.
  repairSwitchToTeStatuts = this.trpc.serviceRoleProcedure
    .input(
      z.object({
        collectiviteId: z.number().int(),
        dryRun: z.boolean().default(true),
      })
    )
    .mutation(async ({ input: { collectiviteId, dryRun } }) => {
      const result = await this.repairSwitchToTeStatutsService.repair(
        collectiviteId,
        { dryRun }
      );
      return this.getResultDataOrThrowError(result);
    });

  router = this.trpc.router({
    switchToTe: this.switchToTe,
    getSwitchToTeStatus: this.getSwitchToTeStatus,
    repairSwitchToTeStatuts: this.repairSwitchToTeStatuts,
  });
}
