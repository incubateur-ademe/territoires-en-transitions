import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { actionStatutSchemaCreate } from '@tet/domain/referentiels';
import {
  UpdateActionStatutService,
  upsertActionStatutsRequestSchema,
} from './update-action-statut.service';

@Injectable()
export class UpdateActionStatutRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateActionStatutService
  ) {}

  router = this.trpc.router({
    updateStatut: this.trpc.authedProcedure
      .input(actionStatutSchemaCreate)
      .mutation(({ input, ctx }) => {
        return this.service.upsertActionStatuts([input], ctx.user);
      }),

    updateStatuts: this.trpc.authedProcedure
      .input(upsertActionStatutsRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertActionStatuts(input.actionStatuts, ctx.user);
      }),
  });
}
