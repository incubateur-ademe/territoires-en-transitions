import type { Estimate } from '@tet/leviers-ges';
import type { EstimateLevierGesResponse } from './estimate-levier-ges.response';

export const toEstimateLevierGesResponse = (
  estimate: Estimate
): EstimateLevierGesResponse => ({
  reduction: estimate.reduction.toFixed(),
  status: estimate.status,
  appliedAssumptions: estimate.appliedAssumptions,
  limits: estimate.limits,
  datasets: estimate.datasets,
});
