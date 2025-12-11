import { z } from 'zod';
import {
  deleteFicheActionNoteSchema,
  upsertFicheActionNoteSchema,
} from './fiche-action-note.table';

export const upsertFicheActionNotesRequestSchema = z
  .object({
    notes: z
      .array(upsertFicheActionNoteSchema)
      .min(1)
      .describe('Liste de notes'),
  })
  .describe('Notes à insérer ou mettre à jour');

export const deleteFicheActionNotesRequestSchema =
  deleteFicheActionNoteSchema.describe('Note à supprimer');
