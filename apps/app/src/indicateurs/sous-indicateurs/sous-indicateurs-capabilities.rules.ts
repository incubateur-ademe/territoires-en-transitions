import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';

export type SousIndicateursCumul = 'enabled' | 'disabled' | 'unavailable';

export type SousIndicateursCapabilities = Readonly<{
  cumul: SousIndicateursCumul;
  canEditStructure: boolean;
}>;

const toCumul = ({
  isPerso,
  totalEstCumulDesSousIndicateurs,
}: {
  isPerso: boolean;
  totalEstCumulDesSousIndicateurs: boolean;
}): SousIndicateursCumul => {
  if (!isPerso) {
    return 'unavailable';
  }
  return totalEstCumulDesSousIndicateurs ? 'enabled' : 'disabled';
};

export const toSousIndicateursCapabilities = (
  indicateur: Pick<
    IndicateurDetaille,
    | 'collectiviteId'
    | 'groupementId'
    | 'identifiantReferentiel'
    | 'totalEstCumulDesSousIndicateurs'
  >
): SousIndicateursCapabilities => {
  const isPerso = isIndicateurPerso(indicateur);
  return {
    cumul: toCumul({
      isPerso,
      totalEstCumulDesSousIndicateurs:
        indicateur.totalEstCumulDesSousIndicateurs,
    }),
    canEditStructure: isPerso,
  };
};
