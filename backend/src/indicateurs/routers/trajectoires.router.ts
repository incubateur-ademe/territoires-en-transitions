import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  SupabaseJwtPayload,
  SupabaseRole,
} from '../../auth/models/supabase-jwt.models';
import { TrpcService } from '../../trpc/services/trpc.service';
import TrajectoiresSpreadsheetService from '../services/trajectoires-spreadsheet.service';

@Injectable()
export class TrajectoiresRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly trajectoiresSpreadsheetService: TrajectoiresSpreadsheetService,
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
        // TODO: token
        const tokenInfo: SupabaseJwtPayload = {
          session_id: '',
          role: SupabaseRole.AUTHENTICATED,
          is_anonymous: false,
        };
        return this.trajectoiresSpreadsheetService.calculeTrajectoireSnbc(
          input,
          tokenInfo,
        );
      }),
  });
}
