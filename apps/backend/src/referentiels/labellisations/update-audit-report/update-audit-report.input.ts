import z from 'zod';

export const updateAuditReportInputSchema = z.object({
  preuveId: z.number().int().positive(),
  fichierId: z.number().int().positive(),
});

export type UpdateAuditReportInput = z.infer<
  typeof updateAuditReportInputSchema
>;
