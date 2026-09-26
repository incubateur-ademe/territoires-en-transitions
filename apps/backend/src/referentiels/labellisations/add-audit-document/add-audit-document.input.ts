import z from 'zod';

export const addAuditDocumentInputSchema = z.object({
  auditId: z.number().int().positive(),
  fichierId: z.number().int().positive(),
});

export type AddAuditDocumentInput = z.infer<typeof addAuditDocumentInputSchema>;
