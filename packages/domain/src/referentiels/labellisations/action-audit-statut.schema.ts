import * as z from 'zod/mini';
import { mesureAuditStatutEnumSchema } from './action-audit-statut.enum.schema';

export const actionAuditStatutSchema = z.object({
  id: z.number(),
  auditId: z.nullable(z.number()),
  mesureId: z.string(),
  collectiviteId: z.number(),
  statut: mesureAuditStatutEnumSchema,
  avis: z.string(),
  ordreDuJour: z.boolean(),
  modifiedBy: z.uuid(),
  modifiedAt: z.iso.datetime(),
});

export const actionAuditStatutSchemaCreate = z.partial(
  actionAuditStatutSchema,
  {
    id: true,
    modifiedBy: true,
    modifiedAt: true,
  }
);
