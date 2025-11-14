import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { tempsDeMiseEnOeuvreTable } from '../../../shared/models/temps-de-mise-en-oeuvre.table';
import { actionImpactFourchetteBudgetaireTable } from './action-impact-fourchette-budgetaire.table';
import { actionImpactTierTable } from './action-impact-tier.table';

export const actionImpactTable = pgTable('action_impact', {
  id: serial('id').primaryKey(),
  titre: text('titre').notNull(),
  description: text('description').notNull(),
  descriptionComplementaire: text('description_complementaire')
    .notNull()
    .default(''),
  nbCollectiviteEnCours: integer('nb_collectivite_en_cours')
    .notNull()
    .default(1),
  nbCollectiviteRealise: integer('nb_collectivite_realise')
    .notNull()
    .default(1),
  actionContinue: boolean('action_continue').notNull().default(false),
  tempsDeMiseEnOeuvre: integer('temps_de_mise_en_oeuvre')
    .notNull()
    .default(1)
    .references(() => tempsDeMiseEnOeuvreTable.id),
  fourchetteBudgetaire: integer('fourchette_budgetaire')
    .notNull()
    .default(1)
    .references(() => actionImpactFourchetteBudgetaireTable.niveau),
  impactTier: integer('impact_tier')
    .notNull()
    .default(1)
    .references(() => actionImpactTierTable.niveau),
  subventionsMobilisables: jsonb('subventions_mobilisables'),
  ressourcesExternes: jsonb('ressources_externes'),
  rex: jsonb('rex'),
});
