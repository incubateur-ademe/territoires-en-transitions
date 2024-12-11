import { AuthUser } from '@/backend/auth/models/auth.models';
import { NiveauAcces } from '@/backend/auth/models/niveau-acces.enum';
import { DatabaseService } from '@/backend/common';
import { Injectable } from '@nestjs/common';
import { and, inArray, or } from 'drizzle-orm';
import z from 'zod';
import { AuthService } from '../../auth/services/auth.service';
import { ficheActionPiloteTable } from '../models/fiche-action-pilote.table';
import {
  ficheActionSchema,
  ficheActionTable,
} from '../models/fiche-action.table';
import { updateFicheActionRequestSchema } from '../models/update-fiche-action.request';

@Injectable()
export class BulkEditService {
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService
  ) {}

  bulkEditRequestSchema = z.object({
    ficheIds: z.array(z.number()),
    statut: ficheActionSchema.shape.statut.optional(),
    pilotes: listSchema(
      updateFicheActionRequestSchema.shape.pilotes.unwrap().unwrap()
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
    await this.auth.verifieAccesAuxCollectivites(
      user,
      collectiviteIds.map((c) => c.collectiviteId),
      NiveauAcces.EDITION
    );

    const { statut, pilotes } = params;

    await this.db.transaction(async (tx) => {
      // Update base params
      if (statut !== undefined) {
        await tx
          .update(ficheActionTable)
          .set({ statut })
          .where(inArray(ficheActionTable.id, ficheIds));
      }

      // Update external relations
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
