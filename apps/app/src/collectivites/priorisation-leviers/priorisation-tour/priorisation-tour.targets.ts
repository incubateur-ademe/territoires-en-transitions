import { createGuidedTourTargets } from '@/app/shared/guided-tour/guided-tour-targets.context';

type PriorisationTargetId = 'metrics' | 'leviersPanel' | 'tourHelp';

const PRIORISATION_TOUR_ID = 'priorisation';

const priorisationTargets =
  createGuidedTourTargets<PriorisationTargetId>(PRIORISATION_TOUR_ID);

export { PRIORISATION_TOUR_ID, priorisationTargets };
export type { PriorisationTargetId };
