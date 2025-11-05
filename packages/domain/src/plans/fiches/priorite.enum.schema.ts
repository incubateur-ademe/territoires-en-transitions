import * as z from 'zod/mini';

export const PrioriteEnum = {
  Élevé: 'Élevé',
  Moyen: 'Moyen',
  Bas: 'Bas',
} as const;
export const prioriteEnumValues = Object.values(PrioriteEnum);
export const prioriteEnumSchema = z.enum(prioriteEnumValues);
export type Priorite = z.infer<typeof prioriteEnumSchema>;
