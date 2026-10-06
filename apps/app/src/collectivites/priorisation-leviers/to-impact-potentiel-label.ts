import { appLabels } from '@/app/labels/catalog';

const IMPACT_SCALE = 100;

export const toImpactPotentielLabel = ({
  potentielReduction,
  potentielTotal,
}: {
  potentielReduction: number;
  potentielTotal: number;
}): string =>
  appLabels.impactPotentielDuTerritoire(
    Math.round((potentielReduction / potentielTotal) * IMPACT_SCALE)
  );
