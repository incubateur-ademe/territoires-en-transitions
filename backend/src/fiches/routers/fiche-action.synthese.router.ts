import { Input, Query, Router } from 'nestjs-trpc';
import { z } from 'zod';
import {
  getFichesActionFilterRequestSchema,
  GetFichesActionFilterRequestType,
} from '../models/get-fiches-actions-filter.request';
import FichesActionSyntheseService from '../services/fiches-action-synthese.service';
import { SupabaseJwtPayload } from 'backend/src/auth/models/supabase-jwt.models';

const inputSchema = z.object({
  id: z.number(),
  filter: getFichesActionFilterRequestSchema,
});

const outputSchema = z.object({
  ok: z.boolean(),
});

@Router()
export class FicheActionSyntheseRouter {
  constructor(private readonly service: FichesActionSyntheseService) {}

  @Query({ input: inputSchema, output: outputSchema })
  async update(
    @Input('collectiviteId') collectiviteId: number,
    @Input('filter') filter: GetFichesActionFilterRequestType
  ) {
    return await this.service.getFichesActionSynthese(
      collectiviteId,
      filter,
      {} as SupabaseJwtPayload
    );
  }
}
