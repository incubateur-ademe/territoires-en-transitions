import {
  invitationTable,
  utilisateurSchema,
} from '@/backend/auth/models/invitation.table';
import { integer, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

export const invitationPersonneTagTable = utilisateurSchema.table(
  'invitation_personne_tag',
  {
    tagId: integer('tag_id').notNull(), // Référence indirectement la table personne_tag pour pouvoir supprimer le tag
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitationTable.id, { onDelete: 'cascade' }),
    tagNom: text('tag_nom').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.tagId, table.invitationId] }),
    };
  }
);
