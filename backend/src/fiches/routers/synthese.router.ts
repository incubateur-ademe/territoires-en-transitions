import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import {
  SupabaseJwtPayload,
  SupabaseRole,
} from '../../auth/models/supabase-jwt.models';
import { TrpcService } from '../../trpc/trpc.service';
import SyntheseService from '../services/synthese.service';
import { getFichesActionFilterRequestSchema } from '../models/get-fiches-actions-filter.request';

const inputSchema = z.object({
  collectiviteId: z.number(),
  body: getFichesActionFilterRequestSchema,
});

@Injectable()
export class SyntheseRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly service: SyntheseService
  ) {}

  router = this.trpc.router({
    synthese: this.trpc.procedure.input(inputSchema).query(({ input }) => {
      const { collectiviteId, body } = input;
      // TODO: token
      const tokenInfo: SupabaseJwtPayload = {
        session_id: '',
        role: SupabaseRole.AUTHENTICATED,
        is_anonymous: false,
      };
      return this.service.getFichesActionSynthese(
        collectiviteId,
        body,
        tokenInfo
      );
    }),
  });
}
