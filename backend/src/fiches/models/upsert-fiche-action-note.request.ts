import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import {
  deleteFicheActionNoteSchema,
  upsertFicheActionNoteSchema,
} from './fiche-action-note.table';

extendZodWithOpenApi(z);

export const upsertFicheActionNotesRequestSchema = extendApi(
  z
    .object({
      notes: extendApi(
        z.array(upsertFicheActionNoteSchema).min(1).openapi({
          description: 'Liste de notes de suivi',
        })
      ),
    })
    .openapi({
      title: 'Notes de suivi à insérer ou mettre à jour',
    })
);

export const deleteFicheActionNotesRequestSchema = extendApi(
  deleteFicheActionNoteSchema.openapi({
    title: 'Note de suivi à supprimer',
  })
);
