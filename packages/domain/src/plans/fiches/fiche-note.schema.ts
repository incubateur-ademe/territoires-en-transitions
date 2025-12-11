import * as z from 'zod';

export const ficheNoteSchema = z.object({
  id: z.number(),
  dateNote: z.iso.datetime(),
  note: z.string(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
  createdBy: z.nullable(z.uuid()),
  modifiedBy: z.nullable(z.uuid()),
});

export type FicheNote = z.infer<typeof ficheNoteSchema>;

export const ficheNoteUpsertSchema = ficheNoteSchema
  .pick({
    dateNote: true,
    note: true,
  })
  .extend({ id: z.number().optional() });

export type FicheNoteUpsert = z.infer<typeof ficheNoteUpsertSchema>;
