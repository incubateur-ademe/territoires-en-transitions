import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { thematiqueSchema, ThematiqueType } from '../../taxonomie/models/thematique.table';
import { categorieFNVSchema, CategorieFNVType } from '../../taxonomie/models/categorie-fnv.table';
import { actionImpactTempsDeMiseEnOeuvreTable } from './action-impact-temps-de-mise-en-oeuvre.table';
import { actionImpactFourchetteBudgetaireTable } from './action-impact-fourchette-budgetaire.table';
import { actionImpactTierTable } from './action-impact-tier.table';
import { createSelectSchema } from 'drizzle-zod';
import { lienSchema, lienType } from '../../documents/models/document-lien.dto';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import { createPlanFromPanierRequestSchema } from './create-plan-from-panier.request';

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
    .references(() => actionImpactTempsDeMiseEnOeuvreTable.niveau),
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
export type ActionImpactType = InferSelectModel<typeof actionImpactTable>;

export const actionImpactSchema = createSelectSchema(actionImpactTable);

/* Une action à impact avec les liens jsonb transformés en type lien */
export type ActionImpactTransformeType = Omit<
  ActionImpactType,
  'rex' | 'ressourcesExternes' | 'subventionsMobilisables'
> & {
  rex: lienType[];
  ressourcesExternes: lienType[];
  subventionsMobilisables: lienType[];
};

export const actionImpactTransformeSchema = actionImpactSchema
  .omit({ rex: true, ressourcesExternes: true, subventionsMobilisables: true })
  .extend({
    rex: z.array(lienSchema),
    ressourcesExternes: z.array(lienSchema),
    subventionsMobilisables: z.array(lienSchema),
  });

/* Le resumé d'une action à impact, utilisé pour les cartes  */
export type ActionImpactSnippetType = ActionImpactTransformeType & {
  thematiques: ThematiqueType[];
};

export const actionImpactSnippetSchema = actionImpactTransformeSchema.extend({
  thematiques: z.array(thematiqueSchema),
});

/* Une action à impact avec des informations complémentaires, utilisé par la modale */
export type ActionImpactDetailsType = ActionImpactTransformeType & {
  thematiques: ThematiqueType[] | null;
} & { categoriesFNV: CategorieFNVType[] | null };

export const actionImpactDetailsSchema = actionImpactTransformeSchema.extend({
  thematiques: z.array(thematiqueSchema).nullable(),
  categoriesFNV: z.array(categorieFNVSchema).nullable(),
});

export class ActionImpactDetailsClass extends createZodDto(
  actionImpactDetailsSchema,
) {}