import type { Solution } from 'ademe-planet';
import type { SolveLevierGesResponse } from './solve-levier-ges.response';
import { toEstimateLevierGesResponse } from './to-estimate-levier-ges-response';

export const toSolveLevierGesResponse = ({
  solveFor,
  value,
  estimate,
}: Solution): SolveLevierGesResponse => ({
  solveFor,
  value,
  estimate: toEstimateLevierGesResponse(estimate),
});
