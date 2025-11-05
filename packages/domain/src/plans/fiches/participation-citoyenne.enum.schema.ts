import * as z from 'zod/mini';

export const participationCitoyenneEnumValues = [
  'pas-de-participation',
  'information',
  'consultation',
  'concertation',
  'co-construction',
] as const;

export const participationCitoyenneEnumSchema = z.enum(
  participationCitoyenneEnumValues
);

export type ParticipationCitoyenne = z.infer<
  typeof participationCitoyenneEnumSchema
>;
