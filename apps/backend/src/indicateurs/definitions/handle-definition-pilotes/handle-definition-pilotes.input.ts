import { indicateurPiloteSchemaCreate } from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const upsertIndicateurDefinitionPilotesInputSchema = z.omit(
  indicateurPiloteSchemaCreate,
  {
    collectiviteId: true,
    indicateurId: true,
  }
);

export type UpsertIndicateurDefinitionPilotesInput = z.infer<
  typeof upsertIndicateurDefinitionPilotesInputSchema
>;
