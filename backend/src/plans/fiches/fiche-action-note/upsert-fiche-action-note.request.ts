import {
  deleteFicheActionNoteSchema,
  upsertFicheActionNoteSchema,
} from '@/backend/plans/fiches/fiche-action-note/fiche-action-note.table';
import { z } from 'zod';

export const upsertFicheActionNotesRequestSchema = z
  .object({
    notes: z
      .array(upsertFicheActionNoteSchema)
      .min(1)
      .describe('Liste de notes de suivi'),
  })
  .describe('Notes de suivi à insérer ou mettre à jour');

export const deleteFicheActionNotesRequestSchema =
  deleteFicheActionNoteSchema.describe('Note de suivi à supprimer');
