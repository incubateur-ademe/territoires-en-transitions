import z from 'zod';

export const removeAnnexeInputSchema = z.object({
  annexeId: z.number().int().positive(),
});

export type RemoveAnnexeInput = z.infer<typeof removeAnnexeInputSchema>;
