import { ficheNoteCreateSchema } from '@/domain/plans';
import { z } from 'zod';

export const upsertFicheActionNotesRequestSchema = z
  .object({
    notes: z
      .array(ficheNoteCreateSchema)
      .min(1)
      .describe('Liste de notes de suivi'),
  })
  .describe('Notes de suivi à insérer ou mettre à jour');

export const deleteFicheActionNotesRequestSchema = z
  .object({ id: z.number() })
  .describe('Note de suivi à supprimer');
