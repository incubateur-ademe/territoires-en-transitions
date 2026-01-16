import * as z from 'zod';
import { dcpSchema } from '../../users';

export const authorSchema = z.object({
  id: dcpSchema.shape.id,
  nom: dcpSchema.shape.nom,
  prenom: dcpSchema.shape.prenom,
});

export type Author = z.infer<typeof authorSchema>;

export const ficheNoteSchema = z.object({
  id: z.number(),
  dateNote: z.string().refine(
    (val) => {
      // Check format first - YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return false;
      }
      // Check if it's a valid date
      const date = new Date(val);
      return !isNaN(date.getTime()) && date.toISOString().startsWith(val);
    },
    {
      message:
        'La date de la note doit être au format YYYY-MM-DD et être une date valide',
    }
  ),
  note: z.string(),
  createdAt: z.iso.datetime(),
  modifiedAt: z.iso.datetime(),
  createdBy: z.nullable(authorSchema),
  modifiedBy: z.nullable(authorSchema),
});

export type FicheNote = z.infer<typeof ficheNoteSchema>;
export const ficheCreateNoteSchema = ficheNoteSchema
  .pick({
    dateNote: true,
    note: true,
  })
  .extend({ id: z.number().optional() });

export const ficheNoteUpsertSchema = z.union([
  ficheCreateNoteSchema,
  ficheNoteSchema,
]);
type FicheNoteCreate = z.infer<typeof ficheCreateNoteSchema>;

export type FicheNoteUpsert = FicheNoteCreate | FicheNote;
