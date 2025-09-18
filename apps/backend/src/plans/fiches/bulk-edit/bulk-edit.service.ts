import FicheActionPermissionsService from '@/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@/backend/plans/fiches/share-fiches/share-fiche.service';
import { ficheActionLibreTagTable } from '@/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionTable } from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionOperationEnum } from '@/backend/users/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/users/authorizations/permission.service';
import { ResourceType } from '@/backend/users/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { and, inArray, or, sql } from 'drizzle-orm';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { BulkEditRequest } from './bulk-edit.request';

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
  ) { }

  async bulkEdit(request: BulkEditRequest, user: AuthUser) {
    const actualFicheIds =
      request.ficheIds === 'all'
        ? (
          await this.listFichesService.getAllFilteredFiches({
            collectiviteId: request.collectiviteId,
            filters: request.filters,
          }, user)
        ).fiches.filter(fiche => fiche.canBeModifiedByCurrentUser !== false).map((fiche) => fiche.id)
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
          PermissionOperationEnum['PLANS.FICHES.EDITION'],
          ResourceType.COLLECTIVITE,
          c.collectiviteId
        );
      } catch (err) {
        this.logger.log(
          `Edition not allowed for collectivite ${c.collectiviteId}, checking fiche sharing`
        );
        const { fiches } = await this.listFichesService.getFilteredFiches({
          collectiviteId: c.collectiviteId,
          filters: {
            ficheIds: c.ficheIds,
          },
        });
        // TODO: Optimize by avoid checking each fiche independently
        const ficheSharingsChecks = fiches.map((fiche) =>
          this.fichePermissionsService.isAllowedByFicheSharings(
            fiche,
            PermissionOperationEnum['PLANS.FICHES.EDITION'],
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
