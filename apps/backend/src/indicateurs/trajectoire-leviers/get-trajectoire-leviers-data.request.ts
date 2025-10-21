import { z } from 'zod';
import { collectiviteAnyIdentifiantInputSchema } from '../../collectivites/collectivite-id.input';

export const getTrajectoireLeviersDataRequestSchema =
  collectiviteAnyIdentifiantInputSchema.extend({
    // TODO: useEpciData
  });
export type GetTrajectoireLeviersDataRequest = z.infer<
  typeof getTrajectoireLeviersDataRequestSchema
>;
