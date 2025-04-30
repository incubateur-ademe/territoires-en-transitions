import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { Injectable, Logger } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import z from 'zod';
import { DatabaseService } from '../../utils/database/database.service';
import {
  collectiviteNatureEnumSchema,
  collectiviteTable,
  collectiviteTypeEnumSchema,
} from '../index-domain';

export const inputSchema = z
  .object({
    text: z.string().optional(),
    limit: z.number().optional(),
    type: collectiviteTypeEnumSchema.optional(),
    natureInsee: collectiviteNatureEnumSchema.optional(),
  })
  .optional()
  .default({ limit: 20 });

@Injectable()
export default class ListCollectivitesService {
  private readonly logger = new Logger(ListCollectivitesService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Récupère les catégories possibles pour une collectivité
   * @param collectiviteId
   * @param withPredefinedTags vrai pour inclure les tags prédéfinis par TeT
   * @param tokenInfo
   */
  async listCollectivites(input: z.infer<typeof inputSchema>) {
    const db = this.db.db;

    const request = db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteTable.nom,
      })
      .from(collectiviteTable);

    if (input?.type) {
      request.where(eq(collectiviteTable.type, input.type));
    }

    if (input?.natureInsee) {
      request.where(eq(collectiviteTable.natureInsee, input.natureInsee));
    }

    if (input?.text) {
      request.where(
        sql`unaccent
          (${collectiviteTable.nom})
          % unaccent(
          ${input.text}
          )`
      );

      // Le plus pertinent en premier
      request.orderBy(
        desc(sql`similarity
        (${collectiviteTable.nom}, ${input.text})`)
      );
    }

    if (input?.limit && input.limit > 0) {
      request.limit(input.limit);
    }

    return request;
  }
}
