import z from 'zod';

export const listDocumentsAuditInputSchema = z.object({
  auditId: z.number().int().positive(),
});

export type ListDocumentsAuditInput = z.infer<typeof listDocumentsAuditInputSchema>;
