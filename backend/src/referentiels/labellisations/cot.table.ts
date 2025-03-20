import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
import { collectiviteTable } from '@/domain/collectivites';
import { boolean, integer, pgTable } from 'drizzle-orm/pg-core';

export const cotTable = pgTable('cot', {
  ...collectiviteId,
  // Vrai si un Contrat d'objectif existe. A pour conséquence la modification des possibilités d'audit.
  actif: boolean('actif').notNull().default(true),
  signataire: integer('signataire').references(() => collectiviteTable.id),
});
