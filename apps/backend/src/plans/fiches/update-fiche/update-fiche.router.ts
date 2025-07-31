import { isAuthenticatedUser } from '@/backend/users/models/auth.models';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { updateFicheRequestSchema } from './update-fiche.request';
import UpdateFicheService from './update-fiche.service';

@Injectable()
export class UpdateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: UpdateFicheService
  ) {}

  router = this.trpc.router({
    update: this.trpc.authedProcedure
      .input(
        z.object({
          ficheId: z.number(),
          ficheFields: updateFicheRequestSchema,
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!isAuthenticatedUser(ctx.user)) {
          throw new Error('Service role user cannot update fiche');
        }

        return this.service.updateFiche({
          ...input,
          user: ctx.user,
        });
      }),
  });
}
