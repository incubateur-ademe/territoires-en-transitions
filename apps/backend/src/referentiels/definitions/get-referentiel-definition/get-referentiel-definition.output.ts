import z from 'zod';
import { referentielDefinitionSchema } from '../../models/referentiel-definition.table';

export const getReferentielDefinitionOutputSchema = referentielDefinitionSchema;

export type GetReferentielDefinitionOutput = z.infer<
  typeof getReferentielDefinitionOutputSchema
>;
