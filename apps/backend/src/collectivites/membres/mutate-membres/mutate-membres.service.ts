import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { CollectiviteRole, ResourceType } from '@tet/domain/users';
import { and, count, eq, sql } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { ListMembresService } from '../list-membres/list-membres.service';
import { membreTable } from '../membre.table';
import {
  MutateMembresErrorEnum,
  type MutateMembresError,
} from './mutate-membres.errors';
import {
  JoinAsMembreInput,
  RemoveMembreInput,
  UpdateMembreInput,
} from './mutate-membres.input';

@Injectable()
export class MutateMembresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionsService: PermissionService,
    private readonly listMembresService: ListMembresService
  ) {}

  async update(
    membres: UpdateMembreInput[],
    user: AuthenticatedUser
  ): Promise<Result<void[], MutateMembresError | CommonError>> {
    const results = await Promise.all(
      membres.map(async ({ collectiviteId, userId, role, ...other }) => {
        let unauthorizedFailure: Result<void, CommonError> | undefined;

        try {
          await this.permissionsService.isAllowed(
            user,
            'collectivites.membres.mutate',
            ResourceType.COLLECTIVITE,
            collectiviteId
          );
        } catch (error) {
          unauthorizedFailure = failure(
            MutateMembresErrorEnum.UNAUTHORIZED,
            error as Error
          );

          if (userId !== user.id) {
            return unauthorizedFailure;
          }
        }

        // fonction/detailsFonction/champIntervention: admin OR self (matrice: soi/oui)
        const hasMembreFields = Object.values(other).some(
          (v) => v !== undefined
        );

        if (hasMembreFields) {
          await this.databaseService.db
            .insert(membreTable)
            .values({
              userId,
              collectiviteId,
              ...other,
            })
            .onConflictDoUpdate({
              target: [membreTable.collectiviteId, membreTable.userId],
              set: other,
            });
        }

        // role modification: admin only (collectivites.membres.mutate)
        if (role !== undefined) {
          if (unauthorizedFailure) {
            return unauthorizedFailure;
          }

          await this.databaseService.db
            .update(utilisateurCollectiviteAccessTable)
            .set({ role })
            .where(
              and(
                eq(utilisateurCollectiviteAccessTable.userId, userId),
                eq(
                  utilisateurCollectiviteAccessTable.collectiviteId,
                  collectiviteId
                )
              )
            );
        }

        return success(undefined);
      })
    );

    return combineResults(results);
  }

  /**
   * Rattache l'utilisateur authentifié à une collectivité (parcours « rejoindre »),
   * uniquement s'il n'existe encore aucun membre actif (premier rattachement → admin).
   * Sinon : erreur — il faut être invité par un administrateur de la collectivité.
   */
  async join(
    input: JoinAsMembreInput,
    user: AuthenticatedUser
  ): Promise<Result<void, MutateMembresError>> {
    const [collectivite] = await this.databaseService.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, input.collectiviteId))
      .limit(1);

    if (!collectivite) {
      return failure(MutateMembresErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    const alreadyActive = await this.listMembresService.isActiveMember({
      userId: user.id,
      collectiviteId: input.collectiviteId,
    });

    if (alreadyActive) {
      return failure(MutateMembresErrorEnum.ALREADY_ACTIVE_MEMBER);
    }

    let collectiviteHasActiveMembers = false;

    await this.databaseService.db.transaction(async (tx) => {
      await tx.execute(sql`
        select 1
        from ${collectiviteTable}
        where ${collectiviteTable.id} = ${input.collectiviteId}
        for update
      `);

      const [{ activeCount }] = await tx
        .select({ activeCount: count() })
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              input.collectiviteId
            ),
            eq(utilisateurCollectiviteAccessTable.isActive, true)
          )
        );

      if (activeCount > 0) {
        collectiviteHasActiveMembers = true;
        return;
      }

      await tx
        .insert(utilisateurCollectiviteAccessTable)
        .values({
          userId: user.id,
          collectiviteId: input.collectiviteId,
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

      await tx
        .insert(membreTable)
        .values({
          userId: user.id,
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
    });

    if (collectiviteHasActiveMembers) {
      return failure(MutateMembresErrorEnum.COLLECTIVITE_HAS_ACTIVE_MEMBERS);
    }

    return success(undefined);
  }

  /** Retire un membre de la collectivité (désactive le droit et supprime les infos membre) */
  async remove(
    { collectiviteId, userId }: RemoveMembreInput,
    user: AuthenticatedUser
  ): Promise<Result<void, MutateMembresError>> {
    if (user.id !== userId) {
      await this.permissionsService.isAllowed(
        user,
        'collectivites.membres.mutate',
        ResourceType.COLLECTIVITE,
        collectiviteId
      );
    }

    const [existing] = await this.databaseService.db
      .select()
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.userId, userId),
          eq(utilisateurCollectiviteAccessTable.collectiviteId, collectiviteId)
        )
      )
      .limit(1);

    if (!existing) {
      return failure(MutateMembresErrorEnum.MEMBER_NOT_FOUND);
    }

    await this.databaseService.db.transaction(async (tx) => {
      await tx
        .update(utilisateurCollectiviteAccessTable)
        .set({ isActive: false })
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.userId, userId),
            eq(
              utilisateurCollectiviteAccessTable.collectiviteId,
              collectiviteId
            )
          )
        );

      await tx
        .delete(membreTable)
        .where(
          and(
            eq(membreTable.userId, userId),
            eq(membreTable.collectiviteId, collectiviteId)
          )
        );
    });

    return success(undefined);
  }
}
