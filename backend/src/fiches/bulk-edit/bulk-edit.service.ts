import { Injectable } from '@nestjs/common';
import { AuthUser } from '@tet/backend/auth/models/auth.models';
import { NiveauAcces } from '@tet/backend/auth/models/private-utilisateur-droit.table';
import { inArray } from 'drizzle-orm';
import z from 'zod';
import { AuthService } from '../../auth/services/auth.service';
import DatabaseService from '../../common/services/database.service';
import {
  ficheActionSchema,
  ficheActionTable,
} from '../models/fiche-action.table';

@Injectable()
export class BulkEditService {
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService
  ) {}

  bulkEditRequestSchema = z.object({
    ficheIds: z.array(z.number()),
    statut: bodySchema(ficheActionSchema.shape.statut),
    personnePilotes: bodySchema(z.object({})),
  });

  async bulkEdit(
    request: z.infer<typeof this.bulkEditRequestSchema>,
    user: AuthUser
  ) {
    const { ficheIds, statut } = request;

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

    await this.db
      .update(ficheActionTable)
      .set({
        statut: statut,
      })
      .where(inArray(ficheActionTable.id, ficheIds));
  }
}

// Helper function to create a sub-schema for each type of field in the input body
function bodySchema<T extends z.ZodTypeAny>(
  schema: T
): T extends z.ZodArray<infer U>
  ? z.ZodObject<{ add?: z.ZodArray<U>; remove: z.ZodArray<U> }>
  : z.ZodOptional<T> {
  if (schema instanceof z.ZodArray) {
    return z.object({
      add: z.array(schema).optional(),
      remove: z.array(schema).optional(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
  }

  // The `as any` casts are necessary because TypeScript can't perfectly infer
  // the exact type transformation happening in the function.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return schema.optional() as any;
}
