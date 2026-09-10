import { Injectable } from '@nestjs/common';
import { personneTagTable } from '@tet/backend/collectivites/tags/personnes/personne-tag.table';
import { indicateurPiloteTable } from '@tet/backend/indicateurs/shared/models/indicateur-pilote.table';
import { dcpTable } from '@tet/backend/users/models/dcp.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  and,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  inArray,
  notInArray,
  or,
  sql,
} from 'drizzle-orm';

type IndicateurPilotesScope = Readonly<{
  indicateurId: number;
  collectiviteId: number;
}>;

type UpsertIndicateurPilotes = IndicateurPilotesScope &
  Readonly<{
    pilotes: Array<
      Readonly<{
        userId?: string | null;
        tagId?: number | null;
      }>
    >;
  }>;

@Injectable()
export class HandleDefinitionPilotesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async arePilotesInCollectivite(
    pilotes: UpsertIndicateurPilotes['pilotes'],
    collectiviteId: number,
    tx?: Transaction
  ): Promise<boolean> {
    const tagIds = [
      ...new Set(
        pilotes
          .map(({ tagId }) => tagId)
          .filter((tagId): tagId is number => tagId != null)
      ),
    ];
    const userIds = [
      ...new Set(
        pilotes
          .map(({ userId }) => userId)
          .filter((userId): userId is string => userId != null)
      ),
    ];
    const readDb = tx ?? this.databaseService.db;

    const tags =
      tagIds.length === 0
        ? []
        : await readDb
            .select({ id: personneTagTable.id })
            .from(personneTagTable)
            .where(
              and(
                inArray(personneTagTable.id, tagIds),
                eq(personneTagTable.collectiviteId, collectiviteId)
              )
            );
    const users =
      userIds.length === 0
        ? []
        : await readDb
            .select({ id: utilisateurCollectiviteAccessTable.userId })
            .from(utilisateurCollectiviteAccessTable)
            .where(
              and(
                inArray(utilisateurCollectiviteAccessTable.userId, userIds),
                eq(
                  utilisateurCollectiviteAccessTable.collectiviteId,
                  collectiviteId
                ),
                eq(utilisateurCollectiviteAccessTable.isActive, true)
              )
            );

    return tags.length === tagIds.length && users.length === userIds.length;
  }

  listIndicateurPilotes({
    indicateurId,
    collectiviteId,
  }: IndicateurPilotesScope) {
    return this.databaseService.db
      .select({
        ...getTableColumns(indicateurPiloteTable),
        nom: sql<string>`
          CASE
            WHEN ${indicateurPiloteTable.userId} IS NOT NULL THEN
              CONCAT(${dcpTable.prenom}, ' ', ${dcpTable.nom})
            WHEN ${indicateurPiloteTable.tagId} IS NOT NULL THEN
              ${personneTagTable.nom}
          END
        `.as('nom'),
      })
      .from(indicateurPiloteTable)
      .leftJoin(dcpTable, eq(dcpTable.id, indicateurPiloteTable.userId))
      .leftJoin(
        personneTagTable,
        eq(personneTagTable.id, indicateurPiloteTable.tagId)
      )
      .where(
        and(
          eq(indicateurPiloteTable.indicateurId, indicateurId),
          eq(indicateurPiloteTable.collectiviteId, collectiviteId)
        )
      )
      .groupBy(
        indicateurPiloteTable.id,
        dcpTable.prenom,
        dcpTable.nom,
        personneTagTable.nom
      );
  }

  async upsertIndicateurPilotes(
    { indicateurId, collectiviteId, pilotes }: UpsertIndicateurPilotes,
    tx?: Transaction
  ): Promise<void> {
    const writeDb = tx ?? this.databaseService.db;
    const { userIds, tagIds } = pilotes.reduce(
      (acc, pilote) => {
        if (pilote.userId) {
          acc.userIds.push(pilote.userId);
        } else if (pilote.tagId) {
          acc.tagIds.push(pilote.tagId);
        }
        return acc;
      },
      { userIds: [] as string[], tagIds: [] as number[] }
    );

    await writeDb
      .delete(indicateurPiloteTable)
      .where(
        and(
          eq(indicateurPiloteTable.indicateurId, indicateurId),
          eq(indicateurPiloteTable.collectiviteId, collectiviteId),
          or(
            and(
              isNotNull(indicateurPiloteTable.tagId),
              tagIds.length > 0
                ? notInArray(indicateurPiloteTable.tagId, tagIds)
                : undefined
            ),
            and(
              isNotNull(indicateurPiloteTable.userId),
              userIds.length > 0
                ? notInArray(indicateurPiloteTable.userId, userIds)
                : undefined
            ),
            and(
              isNull(indicateurPiloteTable.tagId),
              isNull(indicateurPiloteTable.userId)
            )
          )
        )
      );

    if (pilotes.length > 0) {
      await writeDb
        .insert(indicateurPiloteTable)
        .values(
          pilotes.map((pilote) => ({
            ...pilote,
            indicateurId,
            collectiviteId,
          }))
        )
        .onConflictDoNothing();
    }
  }
}
