import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import { getImportCapabilitiesOutputSchema } from './get-import-capabilities.output';
import { GetImportCapabilitiesService } from './get-import-capabilities.service';

@Injectable()
export class GetImportCapabilitiesRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly capabilities: GetImportCapabilitiesService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    aiPlanImportErrorConfig
  );

  router = this.trpc.router({
    getAiImportCapabilities: this.trpc.authedProcedure
      .input(z.object({ collectiviteId: z.number().int().positive() }))
      .output(getImportCapabilitiesOutputSchema)
      .query(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.capabilities.getCapabilities(input, { user })
        )
      ),
  });
}
