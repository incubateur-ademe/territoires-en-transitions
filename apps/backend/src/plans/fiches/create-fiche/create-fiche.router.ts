import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ficheSchemaCreate } from '@tet/domain/plans';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import { updateFicheRequestSchema } from '../update-fiche/update-fiche.request';
import { CreateFicheService } from './create-fiche.service';

const createFicheInput = z.object({
  fiche: ficheSchemaCreate,
  ficheFields: updateFicheRequestSchema.optional(),
});

@Injectable()
export class CreateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateFicheService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(createFicheInput)
      .mutation(async ({ input, ctx }) => {
        const result = await this.service.createFiche(input.fiche, {
          ficheFields: input.ficheFields,
          user: ctx.user,
        });

        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }

        return result.data;
      }),
  });
}
