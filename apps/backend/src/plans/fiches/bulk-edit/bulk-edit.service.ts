import { Injectable, Logger } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { ficheActionLibreTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PermissionOperationEnum } from '@tet/domain/users';
import { and, inArray, or, sql } from 'drizzle-orm';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { BulkEditRequest } from './bulk-edit.input';

@Injectable()
export class BulkEditService {
  private readonly logger = new Logger(BulkEditService.name);

  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly permission: PermissionService,
    private readonly listFichesService: ListFichesService,
    private readonly shareFicheService: ShareFicheService,
    private readonly fichePermissionsService: FicheActionPermissionsService
  ) {}

  async bulkEdit(request: BulkEditRequest, user: AuthUser): Promise<void> {
    const actualFicheIds =
      request.ficheIds === 'all'
        ? (
            await this.listFichesService.getFichesActionResumes({
              collectiviteId: request.collectiviteId,
              filters: request.filters,
            })
          ).data.map((fiche) => fiche.id)
        : request.ficheIds;

    const { ficheIds, ...params } = request;

    // Get all the distinct collectiviteIds of the fiches
    const ficheBycollectiviteIds = await this.db
      .select({
        collectiviteId: ficheActionTable.collectiviteId,
        ficheIds: sql<number[]>`array_agg(${ficheActionTable.id})`.as(
          'fiche_ids'
        ),
      })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, actualFicheIds))
      .groupBy(ficheActionTable.collectiviteId);

    // Check if the user has edition access to all the collectivites
    for (const c of ficheBycollectiviteIds) {
      try {
        await this.permission.isAllowed(
          user,
          PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
          ResourceType.COLLECTIVITE,
          c.collectiviteId
        );
      } catch {
        this.logger.log(
          `Edition not allowed for collectivite ${c.collectiviteId}, checking fiche sharing`
        );
        const { data: fiches } =
          await this.listFichesService.getFichesActionResumes({
            collectiviteId: c.collectiviteId,
            filters: { ficheIds: c.ficheIds },
          });
        // TODO: Optimize by avoid checking each fiche independently
        const ficheSharingsChecks = fiches.map((fiche) =>
          this.fichePermissionsService.isAllowedByFicheSharings(
            fiche,
            PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'],
            user
          )
        );
        await Promise.all(ficheSharingsChecks);
      }
    }

    const { pilotes, libreTags, sharedWithCollectivites, ...plainValues } =
      params;

    await this.db.transaction(async (tx) => {
      // Update modified and plain values
      if (
        pilotes !== undefined ||
        libreTags !== undefined ||
        Object.keys(plainValues).length > 0
      ) {
        await tx
          .update(ficheActionTable)
          .set({
            ...plainValues,
            modifiedBy: user.id,
            modifiedAt: new Date().toISOString(),
          })
          .where(inArray(ficheActionTable.id, actualFicheIds));
      }

      // Update external relation `pilotes`
      if (pilotes !== undefined) {
        if (pilotes.add?.length) {
          const values = actualFicheIds.flatMap((ficheId) => {
            return (pilotes.add ?? []).map((pilote) => ({
              ficheId,
              tagId: pilote.tagId ?? null,
              userId: pilote.userId ?? null,
            }));
          });

          await tx
            .insert(ficheActionPiloteTable)
            .values(values)
            .onConflictDoNothing();
        }

        if (pilotes.remove?.length) {
          const tagIds = pilotes.remove
            .filter((p) => p.tagId)
            .map((p) => p.tagId) as number[];
          const userIds = pilotes.remove
            .filter((p) => p.userId)
            .map((p) => p.userId) as string[];

          await tx
            .delete(ficheActionPiloteTable)
            .where(
              and(
                inArray(ficheActionPiloteTable.ficheId, actualFicheIds),
                or(
                  inArray(ficheActionPiloteTable.tagId, tagIds),
                  inArray(ficheActionPiloteTable.userId, userIds)
                )
              )
            );
        }
      }

      // Update external relation `libreTags`
      if (libreTags !== undefined) {
        if (libreTags.add?.length) {
          const values = actualFicheIds.flatMap((ficheId) => {
            return (libreTags.add ?? []).map((tag) => ({
              ficheId,
              libreTagId: tag.id,
            }));
          });

          await tx
            .insert(ficheActionLibreTagTable)
            .values(values)
            .onConflictDoNothing();
        }

        if (libreTags.remove?.length) {
          const ids = libreTags.remove.map((tag) => tag.id) as number[];

          await tx
            .delete(ficheActionLibreTagTable)
            .where(
              and(
                inArray(ficheActionLibreTagTable.ficheId, actualFicheIds),
                inArray(ficheActionLibreTagTable.libreTagId, ids)
              )
            );
        }
      }

      if (sharedWithCollectivites !== undefined) {
        await this.shareFicheService.bulkShareFiches(
          actualFicheIds,
          sharedWithCollectivites.add?.map((c) => c.id) ?? [],
          sharedWithCollectivites.remove?.map((c) => c.id) ?? [],
          user?.id,
          tx
        );
      }
    });
  }
}
