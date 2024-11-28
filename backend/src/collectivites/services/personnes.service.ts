import { Injectable, Logger } from '@nestjs/common';
import { dcpTable } from '@tet/backend/auth/models/dcp.table';
import { utilisateurDroitTable } from '@tet/backend/auth/models/private-utilisateur-droit.table';
import DatabaseService from '@tet/backend/common/services/database.service';
import { personneTagTable } from '@tet/backend/taxonomie/models/personne-tag.table';
import { and, eq, sql } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import z from 'zod';

export const listRequestSchema = z.object({
  collectiviteId: z.number(),
  filter: z
    .object({
      activeOnly: z.boolean(),
    })
    .optional()
    .default({ activeOnly: true }),
});

export type ListRequest = z.infer<typeof listRequestSchema>;

@Injectable()
export class PersonnesService {
  private readonly logger = new Logger(PersonnesService.name);
  private db = this.database.db;

  constructor(private readonly database: DatabaseService) {}

  async list(request: ListRequest) {
    const selectPersonneTags = this.db
      .select({
        collectiviteId: personneTagTable.collectiviteId,
        nom: personneTagTable.nom,
        tagId: personneTagTable.id,
        userId: sql`null::uuid`.mapWith(utilisateurDroitTable.userId),
        ...(request.filter.activeOnly ? {} : { active: sql<boolean>`null` }),
      })
      .from(personneTagTable)
      .where(eq(personneTagTable.collectiviteId, request.collectiviteId));

    const selectUsers = this.db
      .select({
        collectiviteId: utilisateurDroitTable.collectiviteId,
        nom: sql`(${dcpTable.prenom} || ' ' || ${dcpTable.nom})::text`.mapWith(
          personneTagTable.nom
        ),
        tagId: sql`null::integer`.mapWith(personneTagTable.id),
        userId: utilisateurDroitTable.userId,
        ...(request.filter.activeOnly
          ? {}
          : { active: utilisateurDroitTable.active }),
      })
      .from(utilisateurDroitTable)
      // Inner join pour ne pas inclure les utilisateurs sans DCP
      .innerJoin(dcpTable, eq(dcpTable.userId, utilisateurDroitTable.userId))
      .where(
        request.filter.activeOnly
          ? and(
              eq(utilisateurDroitTable.collectiviteId, request.collectiviteId),
              eq(utilisateurDroitTable.active, true)
            )
          : eq(utilisateurDroitTable.collectiviteId, request.collectiviteId)
      );

    const result = await union(selectPersonneTags, selectUsers);

    return result;
  }
}
