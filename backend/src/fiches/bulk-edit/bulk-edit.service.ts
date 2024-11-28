import { Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import z from 'zod';
import { AuthService } from '../../auth/services/auth.service';
import DatabaseService from '../../common/services/database.service';
import {
  ficheActionSchema,
  ficheActionTable,
} from '../models/fiche-action.table';

const requestSchema = z.object({
  ficheIds: z.array(z.number()),
  statut: bodySchema(ficheActionSchema.shape.statut),
  personnePilotes: bodySchema(z.object({})),
});

type Request = z.infer<typeof requestSchema>;

@Injectable()
export class BulkEditService {
  private db = this.database.db;

  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService
  ) {}

  bulkEditRequestSchema = requestSchema;

  async bulkEdit(request: Request) {
    const { ficheIds, statut } = request;

    await this.db
      .update(ficheActionTable)
      .set({
        statut: statut,
      })
      .where(inArray(ficheActionTable.id, ficheIds));
  }
}

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
