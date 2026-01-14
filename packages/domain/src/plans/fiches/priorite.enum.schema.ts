import * as z from 'zod/mini';
import { createEnumObject } from '../../utils';

const Priorite = ['Élevé', 'Moyen', 'Bas'] as const;
export const PrioriteEnum = createEnumObject(Priorite);
export const isPriorite = (maybePriorite: unknown): maybePriorite is Priorite =>
  typeof maybePriorite === 'string' &&
  Priorite.includes(maybePriorite as Priorite);

export const prioriteEnumValues = Object.values(PrioriteEnum);
export const prioriteEnumSchema = z.enum(prioriteEnumValues);
export type Priorite = z.infer<typeof prioriteEnumSchema>;
