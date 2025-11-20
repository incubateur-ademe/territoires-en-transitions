import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { ficheSchemaCreate } from '@tet/domain/plans';
import { CreateFicheService } from './create-fiche.service';

@Injectable()
export class CreateFicheRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CreateFicheService
  ) {}

  router = this.trpc.router({
    // TODO Brancher ce endpoint aux hooks front qui utilisent encore supabase en direct
    create: this.trpc.authedProcedure
      .input(ficheSchemaCreate)
      .mutation(async ({ input, ctx }) => {
        return this.service.createFiche(input, { user: ctx.user });
      }),
  });
}
