import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { DeleteFicheService } from './delete-fiche.service';

@Injectable()
export class DeleteFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: DeleteFicheService
  ) {}

  router = this.trpc.router({
    delete: this.trpc.authedProcedure
      .input(
        z.object({
          ficheId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return this.service.deleteFiche(input.ficheId, { user: ctx.user });
      }),
  });
}
