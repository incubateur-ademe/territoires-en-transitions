import { RouterInput } from '@tet/api';

type PertinencesListInput =
  RouterInput['collectivites']['pertinenceLeviers']['list'];

export const toPertinencesListInput = (
  collectiviteId: number
): PertinencesListInput => ({ collectiviteId, enjeu: 'ges' });
