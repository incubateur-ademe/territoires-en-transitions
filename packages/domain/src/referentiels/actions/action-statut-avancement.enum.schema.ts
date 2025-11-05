import z from 'zod';

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
