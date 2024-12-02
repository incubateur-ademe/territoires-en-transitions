import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import {
  deleteFicheActionNoteSchema,
  upsertFicheActionNoteSchema,
} from './fiche-action-note.table';

export const upsertFicheActionNotesRequestSchema = extendApi(
  z
    .object({
      notes: extendApi(
        z
          .array(upsertFicheActionNoteSchema)
          .min(1)
          .describe('Liste de notes de suivi')
      ),
    })
    .describe('Notes de suivi à insérer ou mettre à jour')
);

export const deleteFicheActionNotesRequestSchema = extendApi(
  deleteFicheActionNoteSchema.describe('Note de suivi à supprimer')
);
