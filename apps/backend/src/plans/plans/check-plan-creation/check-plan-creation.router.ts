import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { z } from 'zod';
import { CheckPlanCreationService } from './check-plan-creation.service';

@Injectable()
export class CheckPlanCreationRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly creation: CheckPlanCreationService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler();

  router = this.trpc.router({
    getCreationCapabilities: this.trpc.authedProcedure
      .input(z.object({ collectiviteId: z.number().int().positive() }))
      .output(
        z.object({ unavailableTypeIds: z.array(z.number().int().positive()) })
      )
      .query(async ({ input, ctx: { user } }) =>
        this.getResultDataOrThrowError(
          await this.creation.getCapabilities(input, { user })
        )
      ),
  });
}
