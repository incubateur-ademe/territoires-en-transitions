import { modifiedAt, modifiedBy } from '@/backend/utils/column.utils';
import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { actionIdReference } from './action-relation.table';

export const StatutAvancementEnum = {
  FAIT: 'fait',
  PAS_FAIT: 'pas_fait',
  PROGRAMME: 'programme',
  NON_RENSEIGNE: 'non_renseigne',
  DETAILLE: 'detaille',
  NON_CONCERNE: 'non_concerne',
} as const;

export const statutAvancementEnumValues = [
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.NON_RENSEIGNE,
  StatutAvancementEnum.DETAILLE,
  // On omet volontairement le statut "non_concerne" car il est géré uniquement par le front
  // et n'est pas un statut valide stocké en base
] as const;

export const statutAvancementEnumSchema = z.enum(statutAvancementEnumValues);
export type StatutAvancement = z.infer<typeof statutAvancementEnumSchema>;

export const statutAvancementIncludingNonConcerneEnumSchema = z.enum([
  ...statutAvancementEnumValues,
  StatutAvancementEnum.NON_CONCERNE,
]);
export type StatutAvancementIncludingNonConcerne = z.infer<
  typeof statutAvancementIncludingNonConcerneEnumSchema
>;

export const statutAvancementPgEnum = pgEnum(
  'avancement',
  statutAvancementEnumValues
);

export const actionStatutTable = pgTable('action_statut', {
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id),
  actionId: actionIdReference.notNull(),
  avancement: statutAvancementPgEnum('avancement').notNull(),
  avancementDetaille: doublePrecision('avancement_detaille').array(),
  concerne: boolean('concerne').notNull(),
  modifiedBy,
  modifiedAt,
});

export const actionStatutSchema = createSelectSchema(actionStatutTable);
export type ActionStatut = InferSelectModel<typeof actionStatutTable>;

export const actionStatutSchemaInsert = createInsertSchema(actionStatutTable);
export type ActionStatutInsert = z.infer<typeof actionStatutSchemaInsert>;
