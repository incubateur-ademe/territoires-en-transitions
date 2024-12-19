import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import { AuthUser } from '@/backend/auth/models/auth.models';
import { DatabaseService } from '@/backend/common';
import { updateFicheActionRequestSchema } from '@/backend/fiches/models/update-fiche-action.request';
import {
  ficheActionLibreTagTable,
  ficheActionSchema,
  ficheActionTable,
} from '@/backend/plans/fiches';
import { Injectable } from '@nestjs/common';
import { and, inArray, or } from 'drizzle-orm';
import z from 'zod';
import { ficheActionPiloteTable } from '../shared/models/fiche-action-pilote.table';

@Injectable()
export class BulkEditService {
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly permission: PermissionService
  ) {}

  bulkEditRequestSchema = z.object({
    ficheIds: ficheActionSchema.shape.id.array(),
    statut: ficheActionSchema.shape.statut.optional(),
    priorite: ficheActionSchema.shape.priorite.optional(),
    dateFin: ficheActionSchema.shape.dateFin.optional(),
    ameliorationContinue:
      ficheActionSchema.shape.ameliorationContinue.optional(),

    pilotes: listSchema(
      updateFicheActionRequestSchema.shape.pilotes.unwrap().unwrap()
    ),
    libreTags: listSchema(
      updateFicheActionRequestSchema.shape.libresTag.unwrap().unwrap()
    ),
  });

  async bulkEdit(
    request: z.infer<typeof this.bulkEditRequestSchema>,
    user: AuthUser
  ) {
    const { ficheIds, ...params } = request;

    // Get all the distinct collectiviteIds of the fiches
    const collectiviteIds = await this.db
      .selectDistinct({ collectiviteId: ficheActionTable.collectiviteId })
      .from(ficheActionTable)
      .where(inArray(ficheActionTable.id, ficheIds));

    // Check if the user has edition access to all the collectivites
    for (const c of collectiviteIds) {
      await this.permission.isAllowed(
        user,
        PermissionOperation.PLANS_FICHES_EDITION,
        ResourceType.COLLECTIVITE,
        c.collectiviteId
      );
    }

    const { pilotes, libreTags, ...plainValues } = params;

    await this.db.transaction(async (tx) => {
      // Update plain values
      if (Object.keys(plainValues).length) {
        await tx
          .update(ficheActionTable)
          .set(plainValues)
          .where(inArray(ficheActionTable.id, ficheIds));
      }

      // Update external relation `pilotes`
      if (pilotes !== undefined) {
        if (pilotes.add?.length) {
          const values = ficheIds.flatMap((ficheId) => {
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
                inArray(ficheActionPiloteTable.ficheId, ficheIds),
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
          const values = ficheIds.flatMap((ficheId) => {
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
                inArray(ficheActionLibreTagTable.ficheId, ficheIds),
                inArray(ficheActionLibreTagTable.libreTagId, ids)
              )
            );
        }
      }
    });
  }
}

// Utility function to create a sub-schema for array field in the input body
function listSchema<T extends z.ZodTypeAny>(schema: T) {
  return z
    .object({
      add: schema.optional(),
      remove: schema.optional(),
    })
    .optional();
}
