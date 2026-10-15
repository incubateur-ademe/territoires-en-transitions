import { appLabels } from '@/app/labels/catalog';

const IMPACT_SCALE = 100;

type ImpactPotentielInput = {
  potentielReduction: number;
  potentielTotal: number;
};

export const toImpactPotentielScore = ({
  potentielReduction,
  potentielTotal,
}: ImpactPotentielInput): number =>
  Math.round((potentielReduction / potentielTotal) * IMPACT_SCALE);

export const toImpactPotentielLabel = (input: ImpactPotentielInput): string =>
  appLabels.impactPotentielDuTerritoire(toImpactPotentielScore(input));
