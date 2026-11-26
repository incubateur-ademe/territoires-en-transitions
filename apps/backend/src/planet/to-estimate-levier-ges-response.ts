import type { Estimate } from 'ademe-planet';
import type { EstimateLevierGesResponse } from './estimate-levier-ges.response';

export const toEstimateLevierGesResponse = (
  estimate: Estimate
): EstimateLevierGesResponse => ({
  reduction: estimate.reduction,
  status: estimate.status,
  appliedAssumptions: estimate.appliedAssumptions,
  limits: [...estimate.limits],
  datasets: [...estimate.datasets],
});
