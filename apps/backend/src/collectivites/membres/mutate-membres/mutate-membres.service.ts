import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  combineResults,
  failure,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import { CollectiviteRole, ResourceType } from '@tet/domain/users';
import { and, count, eq, inArray, notInArray, sql } from 'drizzle-orm';
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
  UpdateConseillersReferentsInput,
  UpdateMembreInput,
} from './mutate-membres.input';

@Injectable()
export class MutateMembresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionsService: PermissionService,
    private readonly listMembresService: ListMembresService,
    private readonly transactionManager: TransactionManager
  ) {}

  async update(
    membres: UpdateMembreInput[],
    user: AuthenticatedUser
  ): Promise<Result<void[], MutateMembresError | CommonError>> {
    const results = await Promise.all(
      membres.map(async ({ collectiviteId, userId, role, ...other }) => {
        const unauthorizedFailure = failure(
          MutateMembresErrorEnum.UNAUTHORIZED
        );

        const isAdmin = (
          await this.permissionsService.isAllowed(
            user,
            'collectivites.membres.mutate',
            ResourceType.COLLECTIVITE,
            { collectiviteId }
          )
        ).success;

        // Sans droit admin : uniquement ses propres
        // fonction/detailsFonction/champIntervention (matrice: soi/oui),
        // jamais le rôle. Contrôlé avant toute écriture.
        if (!isAdmin && (userId !== user.id || role !== undefined)) {
          return unauthorizedFailure;
        }

        if (Object.values(other).some((v) => v !== undefined)) {
          // Self-update without admin rights: the user must already be an
          // active member of this collectivité before upserting, otherwise any
          // authenticated user could insert a ghost row into membreTable for a
          // collectivité they don't belong to (IDOR — TET-7360).
          if (!isAdmin) {
            const isMember = await this.listMembresService.isActiveMember({
              userId,
              collectiviteId,
            });
            if (!isMember) {
              return unauthorizedFailure;
            }
          }

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

        if (role !== undefined) {
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
   * Désigne les conseillers référents de la collectivité : `userIds` remplace
   * la liste. Seuls des membres actifs de fonction « conseiller » peuvent être
   * désignés ; tout ou rien.
   *
   * Les membres d'une autre fonction ne sont jamais modifiés : ils peuvent
   * s'être déclarés « personne référente » en rejoignant la collectivité, et
   * restent à ce titre contacts dans Recherches.
   */
  async updateConseillersReferents(
    { collectiviteId, userIds }: UpdateConseillersReferentsInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, MutateMembresError | CommonError>> {
    const permission = await this.permissionsService.isAllowed(
      user,
      'collectivites.membres.mutate_conseillers_referents',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success) {
      return failure(MutateMembresErrorEnum.UNAUTHORIZED);
    }

    const referentIds = [...new Set(userIds)];
    const isConseiller = and(
      eq(membreTable.collectiviteId, collectiviteId),
      eq(membreTable.fonction, 'conseiller')
    );

    return this.transactionManager.executeSingle(async (tx) => {
      // Sérialise les désignations d'une même collectivité : sans ce verrou,
      // deux enregistrements concurrents peuvent laisser les deux listes
      // désignées, chaque remise à zéro ne voyant pas l'autre écriture.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext('conseillers_referents'), ${collectiviteId})`
      );

      if (referentIds.length > 0) {
        const designes = await tx
          .update(membreTable)
          .set({ estReferent: true })
          .where(
            and(
              isConseiller,
              inArray(membreTable.userId, referentIds),
              inArray(
                membreTable.userId,
                tx
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

        // Une cible refusée annule toute la transaction
        if (designes.length !== referentIds.length) {
          return failure(MutateMembresErrorEnum.MEMBER_NOT_FOUND);
        }
      }

      await tx
        .update(membreTable)
        .set({ estReferent: false })
        .where(
          and(
            isConseiller,
            eq(membreTable.estReferent, true),
            referentIds.length > 0
              ? notInArray(membreTable.userId, referentIds)
              : undefined
          )
        );

      return success(undefined);
    }, tx);
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
      .select({ id: collectiviteTable.id, type: collectiviteTable.type })
      .from(collectiviteTable)
      .where(eq(collectiviteTable.id, input.collectiviteId))
      .limit(1);

    if (!collectivite) {
      return failure(MutateMembresErrorEnum.COLLECTIVITE_NOT_FOUND);
    }

    if (isServiceDeconcentre(collectivite.type)) {
      return failure(
        MutateMembresErrorEnum.SERVICE_DECONCENTRE_NON_REJOIGNABLE
      );
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
      await this.permissionsService.assertAllowed(
        user,
        'collectivites.membres.mutate',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
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
