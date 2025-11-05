import z from 'zod';
import { referentielDefinitionSchema } from '@/domain/referentiels';

export const getReferentielDefinitionOutputSchema = referentielDefinitionSchema;

export type GetReferentielDefinitionOutput = z.infer<
  typeof getReferentielDefinitionOutputSchema
>;
