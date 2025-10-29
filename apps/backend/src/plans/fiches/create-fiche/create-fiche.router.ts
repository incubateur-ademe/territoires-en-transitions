import { TrpcService } from '@/backend/utils/trpc/trpc.service';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import { ficheSchemaCreate } from '../shared/models/fiche-action.table';
import { updateFicheRequestSchema } from '../update-fiche/update-fiche.request';
import { CreateFicheService } from './create-fiche.service';

@Injectable()
export class CreateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateFicheService
  ) {}

  router = this.trpc.router({
    create: this.trpc.authedProcedure
      .input(
        z.object({
          fiche: ficheSchemaCreate,
          ficheFields: updateFicheRequestSchema.optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return this.service.createFiche(input.fiche, {
          ficheFields: input.ficheFields,
          user: ctx.user,
        });
      }),
  });
}
