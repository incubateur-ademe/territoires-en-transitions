import { z } from 'zod';
import { collectiviteAnyIdentifiantRequestSchema } from '../../collectivites/collectivite.request';

export const getTrajectoireLeviersDataRequestSchema =
  collectiviteAnyIdentifiantRequestSchema.extend({
    // TODO: useEpciData
  });
export type GetTrajectoireLeviersDataRequest = z.infer<
  typeof getTrajectoireLeviersDataRequestSchema
>;
