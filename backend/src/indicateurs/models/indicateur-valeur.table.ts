import {
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { extendApi, extendZodWithOpenApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { createZodDto } from '@anatine/zod-nestjs';
import {
  indicateurDefinitionSchema,
  indicateurDefinitionTable,
  IndicateurDefinitionType,
  minimaleIndicateurDefinitionSchema,
} from './indicateur-definition.table';
import {
  indicateurSourceMetadonneeSchema,
  indicateurSourceMetadonneeTable,
  IndicateurSourceMetadonneeType,
} from './indicateur-source-metadonnee.table';
extendZodWithOpenApi(z);

export const indicateurValeurTable = pgTable('indicateur_valeur', {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, {
      onDelete: 'cascade',
    }),
  indicateurId: integer('indicateur_id')
    .notNull()
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }),
  dateValeur: date('date_valeur').notNull(),
  metadonneeId: integer('metadonnee_id').references(
    () => indicateurSourceMetadonneeTable.id,
    {
      onDelete: 'cascade',
    },
  ),
  resultat: doublePrecision('resultat'),
  resultatCommentaire: text('resultat_commentaire'),
  objectif: doublePrecision('objectif'),
  objectifCommentaire: text('objectif_commentaire'),
  estimation: doublePrecision('estimation'),
  modifiedAt: timestamp('modified_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql.raw(`CURRENT_TIMESTAMP`))
    .notNull(), // with time zone default CURRENT_TIMESTAMP
  modifiedBy: uuid('modified_by'), // TODO: default auth.uid() references auth.users
  createdBy: uuid('created_by'), // TODO: default auth.uid() references auth.users
});

export type IndicateurValeurType = InferSelectModel<
  typeof indicateurValeurTable
>;
export type CreateIndicateurValeurType = InferInsertModel<
  typeof indicateurValeurTable
>;
export const indicateurValeurSchema = createSelectSchema(indicateurValeurTable);
export const createIndicateurValeurSchema = createInsertSchema(
  indicateurValeurTable,
);

export const indicateurValeurGroupeeSchema = extendApi(
  indicateurValeurSchema
    .pick({
      id: true,
      dateValeur: true,
      resultat: true,
      resultatCommentaire: true,
      objectif: true,
      objectifCommentaire: true,
      metadonneeId: true,
    })
    .partial({
      resultat: true,
      resultatCommentaire: true,
      objectif: true,
      objectifCommentaire: true,
      metadonneeId: true,
    }),
);

export type IndicateurValeurGroupeeType = z.infer<
  typeof indicateurValeurGroupeeSchema
>;

export class IndicateurValeurGroupee extends createZodDto(
  indicateurValeurGroupeeSchema,
) {}

export const indicateurAvecValeursSchema = extendApi(
  z
    .object({
      definition: minimaleIndicateurDefinitionSchema,
      valeurs: z.array(indicateurValeurGroupeeSchema),
    })
    .openapi({
      title: 'Indicateur définition et valeurs ordonnées par date',
    }),
);

export type IndicateurAvecValeursType = z.infer<
  typeof indicateurAvecValeursSchema
>;
export class IndicateurAvecValeursClass extends createZodDto(
  indicateurAvecValeursSchema,
) {}

export const indicateurValeursGroupeeParSourceSchema = extendApi(
  z
    .object({
      source: z.string(),
      metadonnees: z.array(indicateurSourceMetadonneeSchema),
      valeurs: z.array(indicateurValeurGroupeeSchema),
    })
    .openapi({
      title: 'Indicateur valeurs pour une source donnée',
    }),
);
export class IndicateurValeursGroupeeParSource extends createZodDto(
  indicateurValeursGroupeeParSourceSchema,
) {}

export const indicateurAvecValeursParSourceSchema = extendApi(
  z
    .object({
      definition: indicateurDefinitionSchema,
      sources: z.record(z.string(), indicateurValeursGroupeeParSourceSchema),
    })
    .openapi({
      title: 'Filtre de récupération des valeurs des indicateurs',
    }),
);
export class IndicateurAvecValeursParSource extends createZodDto(
  indicateurAvecValeursParSourceSchema,
) {}

export interface IndicateurValeurAvecMetadonnesDefinition {
  indicateur_valeur: IndicateurValeurType;

  indicateur_definition: IndicateurDefinitionType | null;

  indicateur_source_metadonnee: IndicateurSourceMetadonneeType | null;
}
