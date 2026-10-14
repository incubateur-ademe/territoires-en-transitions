import type { PlanSecteursCounts } from './data/use-list-plan-secteurs-counts';

/** Actions du plan dont les secteurs réglementaires restent à compléter. */
export const countPlanSecteursARenseigner = ({
  aRenseigner,
  nonAttribuables,
}: PlanSecteursCounts): number => aRenseigner + nonAttribuables;
