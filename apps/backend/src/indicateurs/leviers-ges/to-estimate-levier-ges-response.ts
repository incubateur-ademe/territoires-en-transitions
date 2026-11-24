import type { Estimate } from 'leviers-ges';
import type { EstimateLevierGesResponse } from './estimate-levier-ges.response';

export const toEstimateLevierGesResponse = (
  estimate: Estimate
): EstimateLevierGesResponse => ({
  reduction: estimate.reduction.toFixed(),
  status: estimate.status,
  appliedAssumptions: estimate.appliedAssumptions,
  // Copies : le paquet expose des tableaux `readonly`, le schéma de réponse attend des tableaux modifiables.
  limits: [...estimate.limits],
  datasets: [...estimate.datasets],
});
