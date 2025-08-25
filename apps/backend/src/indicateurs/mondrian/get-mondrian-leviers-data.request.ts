import { z } from 'zod';
import { collectiviteAnyIdentifiantRequestSchema } from '../../collectivites/collectivite.request';

export const getMondrianLeviersDataRequestSchema =
  collectiviteAnyIdentifiantRequestSchema.extend({
    // TODO: useEpciData
  });
export type GetMondrianLeviersDataRequest = z.infer<
  typeof getMondrianLeviersDataRequestSchema
>;
