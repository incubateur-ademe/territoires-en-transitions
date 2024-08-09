import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '../../trpc/services/trpc.service';
import TrajectoiresService from '../service/trajectoires.service';

@Injectable()
export class TrajectoiresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresService: TrajectoiresService,
  ) {}

  router = this.trpc.router({
    snbc: this.trpc.procedure
      .input(
        z.object({
          collectivite_id: z.number(),
          conserve_fichier_temporaire: z.boolean().optional(),
        }),
      )
      .query(({ input }) => {
        return this.trajectoiresService.calculeTrajectoireSnbc(input);
      }),
  });
}
