import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import {
  dcpTable,
  utilisateurPermissionTable,
} from '@/backend/users/index-domain';
import { invitationPersonneTagTable } from '@/backend/users/invitations/invitation-personne-tag.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable } from '@nestjs/common';
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
  private db = this.database.db;
  constructor(private readonly database: DatabaseService) {}

  async list(request: ListRequest) {
    const selectPersonneTags = this.db
      .select({
        collectiviteId: personneTagTable.collectiviteId,
        nom: personneTagTable.nom,
        tagId: personneTagTable.id,
        userId: sql`null::uuid`.mapWith(utilisateurPermissionTable.userId),
        invitationId: invitationPersonneTagTable.invitationId,
        ...(request.filter.activeOnly ? {} : { active: sql<boolean>`null` }),
      })
      .from(personneTagTable)
      .leftJoin(
        invitationPersonneTagTable,
        eq(personneTagTable.id, invitationPersonneTagTable.tagId)
      )
      .where(eq(personneTagTable.collectiviteId, request.collectiviteId));

    const selectUsers = this.db
      .select({
        collectiviteId: utilisateurPermissionTable.collectiviteId,
        nom: sql`(${dcpTable.prenom} || ' ' || ${dcpTable.nom})::text`.mapWith(
          personneTagTable.nom
        ),
        tagId: sql`null::integer`.mapWith(personneTagTable.id),
        userId: utilisateurPermissionTable.userId,
        invitationId: sql`null::uuid`.mapWith(
          invitationPersonneTagTable.invitationId
        ),
        ...(request.filter.activeOnly
          ? {}
          : { active: utilisateurPermissionTable.isActive }),
      })
      .from(utilisateurPermissionTable)
      // Inner join pour ne pas inclure les utilisateurs sans DCP
      .innerJoin(
        dcpTable,
        eq(dcpTable.userId, utilisateurPermissionTable.userId)
      )
      .where(
        request.filter.activeOnly
          ? and(
              eq(
                utilisateurPermissionTable.collectiviteId,
                request.collectiviteId
              ),
              eq(utilisateurPermissionTable.isActive, true)
            )
          : eq(
              utilisateurPermissionTable.collectiviteId,
              request.collectiviteId
            )
      );

    const result = await union(selectPersonneTags, selectUsers);

    return result;
  }
}
