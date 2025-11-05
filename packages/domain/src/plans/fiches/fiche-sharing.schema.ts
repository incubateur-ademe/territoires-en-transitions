import * as z from 'zod/mini';

export const ficheSharingSchema = z.object({
  ficheId: z.number(),
  collectiviteId: z.number(),
  createdAt: z.iso.datetime(),
  createdBy: z.nullable(z.uuid()),
});

export type FicheSharing = z.infer<typeof ficheSharingSchema>;

export const ficheSharingCreateSchema = z.pick(ficheSharingSchema, {
  ficheId: true,
  collectiviteId: true,
});

export type FicheSharingCreate = z.infer<typeof ficheSharingCreateSchema>;
