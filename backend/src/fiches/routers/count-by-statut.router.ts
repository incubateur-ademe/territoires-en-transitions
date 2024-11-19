import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  SupabaseJwtPayload,
  SupabaseRole,
} from '../../auth/models/supabase-jwt.models';
import { TrpcService } from '../../trpc/trpc.service';
import CountByService from '../services/count-by.service';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';

const inputSchema = z.object({
  collectiviteId: z.number(),
  body: getFichesActionFilterRequestSchema,
});

@Injectable()
export class CountByStatutRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: CountByService
  ) {}

  router = this.trpc.router({
    countByStatut: this.trpc.publicProcedure
      .input(inputSchema)
      .query(({ input }) => {
        const { collectiviteId, body } = input;
        // TODO: token
        const tokenInfo: SupabaseJwtPayload = {
          session_id: '',
          role: SupabaseRole.AUTHENTICATED,
          is_anonymous: false,
        };
        return this.service.countByStatut(collectiviteId, body, tokenInfo);
      }),
  });
}
