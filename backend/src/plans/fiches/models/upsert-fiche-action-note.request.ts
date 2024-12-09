import {
  deleteFicheActionNoteSchema,
  upsertFicheActionNoteSchema,
} from '@/backend/plans';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

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
