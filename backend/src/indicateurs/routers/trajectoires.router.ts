import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { TrpcService } from '@/backend/utils/trpc/trpc.service';
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
