import { Injectable, Logger } from '@nestjs/common';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ShareFicheService } from '@tet/backend/plans/fiches/share-fiches/share-fiche.service';
import { ficheActionLibreTagTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-libre-tag.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { getDataOrThrow } from '@tet/backend/utils/result.type';
import { applyJaugeStatutChange, Statut } from '@tet/domain/plans';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, eq, inArray, or } from 'drizzle-orm';
import { NotifyPiloteService } from '../notify-pilote/notify-pilote.service';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';
import { ficheActionReferentTable } from '../shared/models/fiche-action-referent.table';
import { ficheActionServiceTagTable } from '../shared/models/fiche-action-service-tag.table';
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
    private readonly fichePermissionsService: FicheActionPermissionsService,
    private readonly notificationsFicheService: NotifyPiloteService
  ) {}

  async bulkEdit(
    request: BulkEditRequest,
    user: AuthenticatedUser
  ): Promise<void> {
    if (request.ficheIds !== 'all' && request.ficheIds.length === 0) {
      return;
    }

    const filters =
      request.ficheIds === 'all'
        ? request.filters
        : { ficheIds: request.ficheIds };
    const currentFiches = getDataOrThrow(
      await this.listFichesService.getFichesActionResumes(
        {
          collectiviteId: request.collectiviteId,
          filters,
          readsMaskedFields: true,
        },
        { user }
      )
    );
    if (currentFiches.data.length === 0) {
      return;
    }

    const actualFicheIds = currentFiches.data.map((fiche) => fiche.id);
    const fichesByCollectivite = new Map<number, typeof currentFiches.data>();
    for (const fiche of currentFiches.data) {
      const fiches = fichesByCollectivite.get(fiche.collectiviteId) ?? [];
      fiches.push(fiche);
      fichesByCollectivite.set(fiche.collectiviteId, fiches);
    }

    const operation = PermissionOperationEnum['PLANS.FICHES.BULK_UPDATE'];
    for (const [collectiviteId, fiches] of fichesByCollectivite) {
      const permissionResult = await this.permission.isAllowed(
        user,
        operation,
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
      if (!permissionResult.success) {
        // Check sharing for every selected fiche, without another visibility filter.
        await Promise.all(
          fiches.map((fiche) =>
            this.fichePermissionsService.isAllowedByFicheSharings(
              fiche,
              operation,
              user
            )
          )
        );
      }
    }

    const { pilotes, referents, services, libreTags, sharedWithCollectivites } =
      request;
    const plainValues = {
      statut: request.statut,
      priorite: request.priorite,
      dateFin: request.dateFin,
      ameliorationContinue: request.ameliorationContinue,
    };

    await this.db.transaction(async (tx) => {
      // Update modified and plain values
      if (
        pilotes !== undefined ||
        referents !== undefined ||
        services !== undefined ||
        libreTags !== undefined ||
        sharedWithCollectivites !== undefined ||
        Object.values(plainValues).some((value) => value !== undefined)
      ) {
        for (const [collectiviteId, fiches] of fichesByCollectivite) {
          const ficheIds = fiches.map((fiche) => fiche.id);
          const updateGroups =
            plainValues.statut === undefined
              ? [{ ficheIds, jauge: undefined }]
              : await this.groupFichesByJaugeAfterStatutChange(
                  ficheIds,
                  plainValues.statut,
                  tx
                );

          for (const group of updateGroups) {
            await tx
              .update(ficheActionTable)
              .set({
                ...plainValues,
                ...(group.jauge !== undefined && { jauge: group.jauge }),
                modifiedBy: user.id,
                modifiedAt: new Date().toISOString(),
              })
              .where(
                and(
                  inArray(ficheActionTable.id, group.ficheIds),
                  eq(ficheActionTable.collectiviteId, collectiviteId)
                )
              );
          }
        }
      }

      // Update external relation `pilotes`
      if (pilotes !== undefined) {
        if (pilotes.add?.length) {
          const values = actualFicheIds.flatMap((ficheId) => {
            return (pilotes.add ?? []).map((pilote) => ({
              ficheId,
              tagId: pilote.tagId ?? null,
              userId: pilote.userId ?? null,
              createdBy: user.id,
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

      // Update external relation `referents` (élus référents)
      if (referents !== undefined) {
        if (referents.add?.length) {
          const values = actualFicheIds.flatMap((ficheId) => {
            return (referents.add ?? []).map((referent) => ({
              ficheId,
              tagId: referent.tagId ?? null,
              userId: referent.userId ?? null,
              createdBy: user.id,
            }));
          });

          await tx
            .insert(ficheActionReferentTable)
            .values(values)
            .onConflictDoNothing();
        }

        if (referents.remove?.length) {
          const tagIds = referents.remove
            .filter((r) => r.tagId)
            .map((r) => r.tagId) as number[];
          const userIds = referents.remove
            .filter((r) => r.userId)
            .map((r) => r.userId) as string[];

          await tx
            .delete(ficheActionReferentTable)
            .where(
              and(
                inArray(ficheActionReferentTable.ficheId, actualFicheIds),
                or(
                  inArray(ficheActionReferentTable.tagId, tagIds),
                  inArray(ficheActionReferentTable.userId, userIds)
                )
              )
            );
        }
      }

      // Update external relation `services` (directions pilotes)
      if (services !== undefined) {
        if (services.add?.length) {
          const values = actualFicheIds.flatMap((ficheId) => {
            return (services.add ?? []).map((service) => ({
              ficheId,
              serviceTagId: service.id,
            }));
          });

          await tx
            .insert(ficheActionServiceTagTable)
            .values(values)
            .onConflictDoNothing();
        }

        if (services.remove?.length) {
          const ids = services.remove.map((service) => service.id) as number[];

          await tx
            .delete(ficheActionServiceTagTable)
            .where(
              and(
                inArray(ficheActionServiceTagTable.ficheId, actualFicheIds),
                inArray(ficheActionServiceTagTable.serviceTagId, ids)
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

    if ((request.isNotificationEnabled ?? true) && request.pilotes) {
      // recharge les fiches mises à jour
      const updatedFiches = getDataOrThrow(
        await this.listFichesService.getFichesActionResumes(
          {
            collectiviteId: request.collectiviteId,
            filters,
            readsMaskedFields: true,
          },
          { user }
        )
      );

      // prépare les paires de fiches (avant/après)
      const fichesPairs = actualFicheIds
        .map((id) => {
          const previousFiche = currentFiches.data.find((f) => f.id === id);
          const updatedFiche = updatedFiches.data.find((f) => f.id === id);
          return previousFiche && updatedFiche
            ? { previousFiche, updatedFiche }
            : null;
        })
        .filter((pair) => pair !== null);

      // ajoute les notifications en masse
      if (fichesPairs.length > 0) {
        try {
          await this.notificationsFicheService.upsertPiloteNotificationsBulk({
            fichesPairs,
            user,
          });
        } catch (error) {
          this.logger.error(
            "Erreur lors de l'envoi des notifications pilote pour l'édition groupée",
            error
          );
        }
      }
    }
  }

  private async groupFichesByJaugeAfterStatutChange(
    ficheIds: number[],
    statut: Statut | null,
    tx: Transaction
  ): Promise<{ ficheIds: number[]; jauge: number | undefined }[]> {
    const fiches = await tx
      .select({
        id: ficheActionTable.id,
        statut: ficheActionTable.statut,
        jauge: ficheActionTable.jauge,
        parentId: ficheActionTable.parentId,
      })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds));

    const ficheIdsByJauge = new Map<number, number[]>();
    for (const fiche of fiches) {
      const result = applyJaugeStatutChange({
        before: { statut: fiche.statut, jauge: fiche.jauge },
        change: { statut },
        isSousAction: fiche.parentId !== null,
      });
      const jauge = result.success ? result.data.jauge : fiche.jauge;
      ficheIdsByJauge.set(jauge, [
        ...(ficheIdsByJauge.get(jauge) ?? []),
        fiche.id,
      ]);
    }

    return [...ficheIdsByJauge].map(([jauge, ids]) => ({
      ficheIds: ids,
      jauge,
    }));
  }
}
