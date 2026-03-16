import z from 'zod';

export const StatutAvancementEnum = {
  FAIT: 'fait',
  PAS_FAIT: 'pas_fait',
  PROGRAMME: 'programme',
  NON_RENSEIGNE: 'non_renseigne',
  DETAILLE: 'detaille',
  NON_CONCERNE: 'non_concerne',
  DETAILLE_A_LA_TACHE: 'detaille_a_la_tache',
} as const;

export const statutAvancementEnumValues = [
  StatutAvancementEnum.FAIT,
  StatutAvancementEnum.PAS_FAIT,
  StatutAvancementEnum.PROGRAMME,
  StatutAvancementEnum.DETAILLE,
  StatutAvancementEnum.NON_RENSEIGNE,
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

export const statutAvancementIncludingNonConcerneDetailleALaTacheEnumSchema =
  z.enum([
    ...statutAvancementEnumValues,
    StatutAvancementEnum.NON_CONCERNE,
    StatutAvancementEnum.DETAILLE_A_LA_TACHE,
  ]);
export type StatutAvancementIncludingNonConcerneDetailleALaTache = z.infer<
  typeof statutAvancementIncludingNonConcerneDetailleALaTacheEnumSchema
>;
