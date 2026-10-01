import { ficheSecteursSchema } from '@tet/domain/plans';
import { z } from 'zod';

export const getFicheSecteursOutputSchema = ficheSecteursSchema;

export type GetFicheSecteursOutput = z.infer<
  typeof getFicheSecteursOutputSchema
>;
