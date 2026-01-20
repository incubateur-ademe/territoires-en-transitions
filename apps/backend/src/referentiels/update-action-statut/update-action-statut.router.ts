import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import {
  UpdateActionStatutService,
  upsertActionStatutRequestSchema,
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
      .input(upsertActionStatutRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertActionStatuts([input.actionStatut], ctx.user);
      }),

    updateStatuts: this.trpc.authedProcedure
      .input(upsertActionStatutsRequestSchema)
      .mutation(({ input, ctx }) => {
        return this.service.upsertActionStatuts(input.actionStatuts, ctx.user);
      }),
  });
}
