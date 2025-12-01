import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/roles/private-utilisateur-droit.table';
import { invitationPersonneTagTable } from '@tet/backend/users/invitations/invitation-personne-tag.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { union } from 'drizzle-orm/pg-core';
import z from 'zod';

export const listRequestSchema = z.object({
  collectiviteIds: z.array(z.number()),
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
  private db = this.database.db;
  constructor(private readonly database: DatabaseService) {}

  async list(request: ListRequest) {
    const selectPersonneTags = this.db
      .select({
        collectiviteId: personneTagTable.collectiviteId,
        nom: personneTagTable.nom,
        tagId: personneTagTable.id,
        userId: sql`null::uuid`.mapWith(
          utilisateurCollectiviteAccessTable.userId
        ),
        invitationId: invitationPersonneTagTable.invitationId,
        ...(request.filter.activeOnly ? {} : { active: sql<boolean>`null` }),
      })
      .from(personneTagTable)
      .leftJoin(
        invitationPersonneTagTable,
        eq(personneTagTable.id, invitationPersonneTagTable.tagId)
      )
      .where(inArray(personneTagTable.collectiviteId, request.collectiviteIds));

    const selectUsers = this.db
      .select({
        collectiviteId: utilisateurCollectiviteAccessTable.collectiviteId,
        nom: sql`(${dcpTable.prenom} || ' ' || ${dcpTable.nom})::text`.mapWith(
          personneTagTable.nom
        ),
        tagId: sql`null::integer`.mapWith(personneTagTable.id),
        userId: utilisateurCollectiviteAccessTable.userId,
        invitationId: sql`null::uuid`.mapWith(
          invitationPersonneTagTable.invitationId
        ),
        ...(request.filter.activeOnly
          ? {}
          : { active: utilisateurCollectiviteAccessTable.isActive }),
      })
      .from(utilisateurCollectiviteAccessTable)
      // Inner join pour ne pas inclure les utilisateurs sans DCP
      .innerJoin(
        dcpTable,
        eq(dcpTable.userId, utilisateurCollectiviteAccessTable.userId)
      )
      .where(
        request.filter.activeOnly
          ? and(
              inArray(
                utilisateurCollectiviteAccessTable.collectiviteId,
                request.collectiviteIds
              ),
              eq(utilisateurCollectiviteAccessTable.isActive, true)
            )
          : inArray(
              utilisateurCollectiviteAccessTable.collectiviteId,
              request.collectiviteIds
            )
      );

    const result = await union(selectPersonneTags, selectUsers);
    // remove duplicates
    const uniqueResult = result.filter(
      (item, index, self) =>
        index ===
        self.findIndex(
          (t) => t.userId === item.userId && t.tagId === item.tagId
        )
    );

    return uniqueResult;
  }
}
