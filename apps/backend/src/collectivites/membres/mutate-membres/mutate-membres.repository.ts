import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { CollectiviteRole } from '@tet/domain/users';
import { and, count, eq, inArray, notInArray, sql } from 'drizzle-orm';
import { membreTable } from '../membre.table';
import {
  JoinAsMembreInput,
  UpdateConseillersReferentsInput,
  UpdateMembreInput,
} from './mutate-membres.input';

type MembreIdentifier = Pick<UpdateMembreInput, 'collectiviteId' | 'userId'>;

@Injectable()
export class MutateMembresRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async upsertMembreDetails(
    { collectiviteId, userId, ...details }: Omit<UpdateMembreInput, 'role'>,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .insert(membreTable)
      .values({ userId, collectiviteId, ...details })
      .onConflictDoUpdate({
        target: [membreTable.collectiviteId, membreTable.userId],
        set: details,
      });
  }

  async updateMembreRole(
    {
      collectiviteId,
      userId,
      role,
    }: Required<Pick<UpdateMembreInput, 'collectiviteId' | 'userId' | 'role'>>,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .update(utilisateurCollectiviteAccessTable)
      .set({ role })
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      );
  }

  async lockConseillersReferents(collectiviteId: number, tx: Transaction) {
    // Sérialise les remplacements de la liste pour une même collectivité.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('conseillers_referents'), ${collectiviteId})`
    );
  }

  async setConseillersReferents(
    { collectiviteId, userIds }: UpdateConseillersReferentsInput,
    tx?: Transaction
  ) {
    const db = tx ?? this.databaseService.db;
    return db
      .update(membreTable)
      .set({ estReferent: true })
      .where(
        and(
          eq(membreTable.collectiviteId, collectiviteId),
          eq(membreTable.fonction, 'conseiller'),
          inArray(membreTable.userId, userIds),
          inArray(
            membreTable.userId,
            db
              .select({ userId: utilisateurCollectiviteAccessTable.userId })
              .from(utilisateurCollectiviteAccessTable)
              .where(
                and(
                  eq(
                    utilisateurCollectiviteAccessTable.collectiviteId,
                    collectiviteId
                  ),
                  eq(utilisateurCollectiviteAccessTable.isActive, true)
                )
              )
          )
        )
      )
      .returning({ userId: membreTable.userId });
  }

  async clearOtherConseillersReferents(
    { collectiviteId, userIds }: UpdateConseillersReferentsInput,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .update(membreTable)
      .set({ estReferent: false })
      .where(
        and(
          eq(membreTable.collectiviteId, collectiviteId),
          eq(membreTable.fonction, 'conseiller'),
          eq(membreTable.estReferent, true),
          userIds.length > 0
            ? notInArray(membreTable.userId, userIds)
            : undefined
        )
      );
  }

  async getCollectivite(collectiviteId: number, tx?: Transaction) {
    const [collectivite] = await (tx ?? this.databaseService.db)
      .select({ id: collectiviteTable.id, type: collectiviteTable.type })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, collectiviteId))
      .limit(1);
    return collectivite;
  }

  async countActiveMembresForUpdate(collectiviteId: number, tx: Transaction) {
    // Le verrou reste détenu jusqu'à la fin du rattachement dans cette transaction.
    await tx.execute(sql`
      select 1
      from ${collectiviteTable}
      where ${collectiviteTable.id} = ${collectiviteId}
      for update
    `);

    const [{ activeCount }] = await tx
      .select({ activeCount: count() })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      );
    return activeCount;
  }

  async upsertAdminAccess(
    { collectiviteId, userId }: MembreIdentifier,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .insert(utilisateurCollectiviteAccessTable)
      .values({
        userId,
        collectiviteId,
        isActive: true,
        role: CollectiviteRole.ADMIN,
        invitationId: null,
      })
      .onConflictDoUpdate({
        target: [
          utilisateurCollectiviteAccessTable.userId,
          utilisateurCollectiviteAccessTable.collectiviteId,
        ],
        set: {
          isActive: true,
          role: CollectiviteRole.ADMIN,
          invitationId: null,
          modifiedAt: sql`now()`,
        },
      });
  }

  async upsertJoinedMembre(
    input: JoinAsMembreInput & { userId: string },
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .insert(membreTable)
      .values({
        userId: input.userId,
        collectiviteId: input.collectiviteId,
        fonction: input.fonction,
        detailsFonction: input.detailsFonction || '',
        champIntervention: input.champIntervention,
        estReferent: input.estReferent,
      })
      .onConflictDoUpdate({
        target: [membreTable.collectiviteId, membreTable.userId],
        set: {
          fonction: input.fonction,
          detailsFonction: input.detailsFonction || '',
          champIntervention: input.champIntervention,
          estReferent: input.estReferent,
          modifiedAt: sql`now()`,
        },
      });
  }

  async getMembreAccess(
    { collectiviteId, userId }: MembreIdentifier,
    tx?: Transaction
  ) {
    const [access] = await (tx ?? this.databaseService.db)
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);
    return access;
  }

  async deactivateMembreAccess(
    { collectiviteId, userId }: MembreIdentifier,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .update(utilisateurCollectiviteAccessTable)
      .set({ isActive: false })
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      );
  }

  async deleteMembre(
    { collectiviteId, userId }: MembreIdentifier,
    tx?: Transaction
  ) {
    await (tx ?? this.databaseService.db)
      .delete(membreTable)
      .where(
        and(
          eq(membreTable.userId, userId),
          eq(membreTable.collectiviteId, collectiviteId)
        )
      );
  }
}
