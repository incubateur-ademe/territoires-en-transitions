import { z } from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/collectivite.request';

export const getMondrianLeviersDataRequestSchema =
  collectiviteRequestSchema.extend({
    // TODO: useEpciData
  });
export type GetMondrianLeviersDataRequest = z.infer<
  typeof getMondrianLeviersDataRequestSchema
>;
