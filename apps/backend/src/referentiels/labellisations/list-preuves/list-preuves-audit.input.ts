import z from 'zod';

export const listPreuvesAuditInputSchema = z.object({
  auditId: z.number().int().positive(),
});

export type ListPreuvesAuditInput = z.infer<
  typeof listPreuvesAuditInputSchema
>;
