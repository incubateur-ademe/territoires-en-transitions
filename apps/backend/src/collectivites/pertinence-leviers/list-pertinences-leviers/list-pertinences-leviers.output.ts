import { pertinenceLevierSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const pertinencesLeviersSchema = z.object({
  collectiviteId: z.number().int().positive(),
  pertinences: z.array(pertinenceLevierSchema),
});

export type PertinencesLeviers = z.output<typeof pertinencesLeviersSchema>;
