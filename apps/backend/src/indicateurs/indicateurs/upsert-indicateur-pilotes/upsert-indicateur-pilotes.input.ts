import { indicateurPiloteSchemaCreate } from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const upsertIndicateurPilotesInputSchema = z.omit(
  indicateurPiloteSchemaCreate,
  {
    collectiviteId: true,
    indicateurId: true,
  }
);

export type UpsertIndicateurPilotesInput = z.infer<
  typeof upsertIndicateurPilotesInputSchema
>;
