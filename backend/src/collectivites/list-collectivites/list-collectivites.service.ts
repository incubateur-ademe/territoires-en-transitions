import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { Injectable, Logger } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import z from 'zod';
import { DatabaseService } from '../../utils/database/database.service';
import { collectiviteTable, communeTable, epciTable } from '../index-domain';

export const inputSchema = z
  .object({
    text: z.string().optional(),
    limit: z.number().optional(),
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

    const collectiviteNom =
      sql`COALESCE(${epciTable.nom}, ${communeTable.nom})`.mapWith(
        epciTable.nom
      );

    const request = db
      .select({
        id: collectiviteTable.id,
        nom: collectiviteNom,
      })
      .from(collectiviteTable)
      .leftJoin(epciTable, eq(epciTable.collectiviteId, collectiviteTable.id))
      .leftJoin(
        communeTable,
        eq(communeTable.collectiviteId, collectiviteTable.id)
      );

    if (input?.text) {
      request.where(
        sql`unaccent(${collectiviteNom}) % unaccent(${input.text})`
      );

      // Le plus pertinent en premier
      request.orderBy(desc(sql`similarity(${collectiviteNom}, ${input.text})`));
    }

    if (input?.limit) {
      request.limit(input.limit);
    }

    return request;
  }
}
