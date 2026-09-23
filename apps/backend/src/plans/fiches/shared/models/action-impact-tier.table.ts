import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const actionImpactTierTable = pgTable('action_impact_tier', {
  niveau: serial('niveau').primaryKey(),
  nom: text('nom').notNull(),
});
