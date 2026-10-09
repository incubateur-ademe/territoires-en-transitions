import * as z from 'zod/mini';
import { createEnumObject } from '../../utils';

export const planSourceValues = ['import_ia'] as const;

/** Origine d'un plan ; absente (`null`) pour un plan créé à la main. */
export const PlanSourceEnum = createEnumObject(planSourceValues);
export const planSourceSchema = z.enum(planSourceValues);
export type PlanSource = z.infer<typeof planSourceSchema>;
