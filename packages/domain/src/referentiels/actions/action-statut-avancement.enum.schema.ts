import z from 'zod';

export const StatutAvancementEnum = {
  FAIT: 'fait',
  PAS_FAIT: 'pas_fait',
  PROGRAMME: 'programme',
  NON_RENSEIGNE: 'non_renseigne',
  NON_RENSEIGNABLE: 'non_renseignable',
  DETAILLE_AU_POURCENTAGE: 'detaille',
  DETAILLE_A_LA_TACHE: 'detaille_a_la_tache',
  NON_CONCERNE: 'non_concerne',
} as const;

export const statutAvancementEnumValues = [
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.NON_RENSEIGNE,
  StatutAvancementEnum.NON_RENSEIGNABLE,
  StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
  StatutAvancementEnum.DETAILLE_A_LA_TACHE,
  StatutAvancementEnum.NON_CONCERNE,
] as const;

export const statutAvancementEnumSchema = z.enum(statutAvancementEnumValues);
export type StatutAvancement = z.infer<typeof statutAvancementEnumSchema>;

export const statutAvancementEnumSchemaCreateInDatabase = z.enum([
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.NON_RENSEIGNE,
  StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
]);

export type StatutAvancementCreateInDatabase = z.infer<
  typeof statutAvancementEnumSchemaCreateInDatabase
>;

export const statutAvancementEnumCreateSchema = z.enum([
  ...statutAvancementEnumSchemaCreateInDatabase.options,

  StatutAvancementEnum.NON_CONCERNE,
  StatutAvancementEnum.DETAILLE_A_LA_TACHE,
]);
export type StatutAvancementCreate = z.infer<
  typeof statutAvancementEnumCreateSchema
>;
