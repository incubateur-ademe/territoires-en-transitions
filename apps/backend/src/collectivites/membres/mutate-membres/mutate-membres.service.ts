import { Injectable } from '@nestjs/common';
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
import { ResourceType } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedUser } from '../../../users/models/auth.models';
import { membreTable } from '../membre.table';
import {
  MutateMembresErrorEnum,
  type MutateMembresError,
} from './mutate-membres.errors';
import { RemoveMembreInput, UpdateMembreInput } from './mutate-membres.input';

@Injectable()
export class MutateMembresService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionsService: PermissionService
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
