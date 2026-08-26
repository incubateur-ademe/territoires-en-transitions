import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { demarchePcaetTransitionInputSchema } from '../shared/demarche-pcaet-transition.input';
import { cloreInstructionErrorConfig } from './clore-instruction.errors';
import { CloreInstructionService } from './clore-instruction.service';

@Injectable()
export class CloreInstructionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly cloreInstructionService: CloreInstructionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    cloreInstructionErrorConfig
  );

  router = this.trpc.router({
    /**
     * Rattrapage des dossiers dont le délai d'avis est échu, appelé par le
     * planificateur. Réservé au service role : ce n'est l'acte de personne, et
     * surtout pas celui de la collectivité.
     */
    cloreInstructionsEchues: this.trpc.serviceRoleProcedure
      .input(z.object({}))
      .mutation(async () => {
        const result =
          await this.cloreInstructionService.cloreInstructionsEchues();
        return this.getResultDataOrThrowError(result);
      }),

    /**
     * Le même constat sur un dossier précis. Rend `null` si aucune des deux
     * conditions n'est réunie — ce n'est pas une erreur, juste un dossier qui
     * n'a pas encore lieu de basculer.
     */
    cloreInstruction: this.trpc.serviceRoleProcedure
      .input(demarchePcaetTransitionInputSchema)
      .mutation(async ({ input }) => {
        const result = await this.cloreInstructionService.clore(input);
        return this.getResultDataOrThrowError(result);
      }),
  });
}
