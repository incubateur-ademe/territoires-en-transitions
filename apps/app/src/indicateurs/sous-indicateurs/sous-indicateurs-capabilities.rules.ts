import {
  type IndicateurDetaille,
  isIndicateurPerso,
} from '@tet/domain/indicateurs';

export type SousIndicateursCapabilities = Readonly<{
  canTotaliser: boolean;
  canEditStructure: boolean;
}>;

export const toSousIndicateursCapabilities = (
  indicateur: Pick<
    IndicateurDetaille,
    'collectiviteId' | 'groupementId' | 'identifiantReferentiel'
  >
): SousIndicateursCapabilities => {
  const isPerso = isIndicateurPerso(indicateur);
  return { canTotaliser: isPerso, canEditStructure: isPerso };
};
