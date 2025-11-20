import { referentielDefinitionSchema } from '@tet/domain/referentiels';
import z from 'zod';

export const getReferentielDefinitionOutputSchema = referentielDefinitionSchema;

export type GetReferentielDefinitionOutput = z.infer<
  typeof getReferentielDefinitionOutputSchema
>;
