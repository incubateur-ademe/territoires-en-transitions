import { Pertinence } from './pertinence.enum';

export type PertinenceVoletEffective =
  | { kind: 'mobilise' }
  | { kind: 'heritee_du_levier' }
  | { kind: 'propre'; pertinence?: Pertinence };

export const resolvePertinenceVolet = ({
  isMobilise,
  levierPertinence,
  voletPertinence,
}: {
  isMobilise: boolean;
  levierPertinence?: Pertinence;
  voletPertinence?: Pertinence;
}): PertinenceVoletEffective => {
  if (isMobilise) {
    return { kind: 'mobilise' };
  }
  if (levierPertinence === 'non_pertinent') {
    return { kind: 'heritee_du_levier' };
  }
  if (voletPertinence === undefined) {
    return { kind: 'propre' };
  }
  return { kind: 'propre', pertinence: voletPertinence };
};
