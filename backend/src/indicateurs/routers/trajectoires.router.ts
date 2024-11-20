import { Injectable } from '@nestjs/common';
import { TrpcService } from '@tet/backend/trpc/trpc.service';
import { z } from 'zod';
import TrajectoiresSpreadsheetService from '../services/trajectoires-spreadsheet.service';

@Injectable()
export class TrajectoiresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService
  ) {}

  router = this.trpc.router({
    snbc: this.trpc.authedProcedure
      .input(
        z.object({
          collectiviteId: z.number(),
          conserve_fichier_temporaire: z.boolean().optional(),
        })
      )
      .query(({ input, ctx }) => {
        return this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
          input,
          ctx.user
        );
      }),
  });
}
