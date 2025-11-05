import * as z from 'zod/mini';

export const ficheEtapeSchema = z.object({
  id: z.number(),
  ficheId: z.number(),
  nom: z.nullable(z.string()),
  ordre: z.number(),
  realise: z.optional(z.boolean()),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
  createdBy: z.nullable(z.uuid()),
  modifiedBy: z.nullable(z.uuid()),
});

export type FicheEtape = z.infer<typeof ficheEtapeSchema>;

export const ficheEtapeCreateSchema = z.partial(ficheEtapeSchema, {
  id: true,
  nom: true,
  createdAt: true,
  modifiedAt: true,
  createdBy: true,
  modifiedBy: true,
});

export type FicheEtapeCreate = z.infer<typeof ficheEtapeCreateSchema>;
