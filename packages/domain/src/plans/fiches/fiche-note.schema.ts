import * as z from 'zod/mini';

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

export const ficheNoteCreateSchema = z.partial(
  z.pick(ficheNoteSchema, {
    id: true,
    dateNote: true,
    note: true,
  }),
  { id: true }
);

export type FicheNoteCreate = z.infer<typeof ficheNoteCreateSchema>;
