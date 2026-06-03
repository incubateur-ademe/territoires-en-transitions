import { z } from 'zod';
import { createEnumObject } from '../../utils';

export const actionAdaptationNiveauValues = [
  'exposition_faible',
  'exposition_partielle',
  'exposition_forte',
] as const;

export const ActionAdaptationNiveauEnum = createEnumObject(
  actionAdaptationNiveauValues
);

export const actionAdaptationNiveauSchema = z.enum(
  actionAdaptationNiveauValues
);

export type ActionAdaptationNiveau = z.infer<
  typeof actionAdaptationNiveauSchema
>;
