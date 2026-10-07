import { pertinenceLevierSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import { listPertinencesLeviersInputSchema } from '../list-pertinences-leviers/list-pertinences-leviers.input';

export const upsertPertinenceLevierInputSchema =
  listPertinencesLeviersInputSchema.extend(pertinenceLevierSchema.shape);

export type UpsertPertinenceLevierInput = z.output<
  typeof upsertPertinenceLevierInputSchema
>;
