import { LEVIER_ID_BY_NOM } from '@tet/domain/shared';
import { ClassifyBatchOutcome } from '../classify-batch/classify-batch.service';
import { ClassificationOutcome } from '../models/classification-outcome';
import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';

const toVoletMobilisations = (fiches: ClassifiedFiche[]): FicheVolet[] =>
  fiches.flatMap(({ ficheId, volets }) =>
    volets.map(({ levier, categorie }) => ({
      ficheId,
      levierId: LEVIER_ID_BY_NOM[levier],
      categorie,
    }))
  );

export const toClassificationOutcome = (
  classifications: ClassifyBatchOutcome[]
): ClassificationOutcome => {
  const classifiedFiches = classifications.flatMap(
    ({ classified }) => classified
  );

  return {
    report: { fiches: classifiedFiches },
    fiches: classifications.flatMap(({ sources }) => sources),
    volets: toVoletMobilisations(classifiedFiches),
  };
};
