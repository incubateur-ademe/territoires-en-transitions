import * as z from 'zod/mini';
import { preuveBaseSchema } from './preuve-base.schema';

export const preuveAuditSchema = z.object({
  ...preuveBaseSchema.shape,
  auditId: z.number(),
});

export type PreuveAudit = z.infer<typeof preuveAuditSchema>;
