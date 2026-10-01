import type { Dataset } from '@/app/ui/charts/echarts/utils';
import {
  formatIndicateurPeriod,
  IndicateurPeriods,
  type IndicateurReferenceObjectif,
  type IndicateurReferenceObjectifHorizon,
  normalizeIndicateurReferenceObjectifs,
} from '@tet/domain/indicateurs';
import { LAYERS } from './layer-parameters';

type PrepareReferenceObjectifsDatasetInput = {
  valeurs: readonly IndicateurReferenceObjectif[];
  unite: string;
  libelle: string | null;
};

const getObjectifReferenceName = (
  objectifs: readonly IndicateurReferenceObjectifHorizon[],
  unite: string,
  libelle: string | null
) => {
  if (objectifs.length === 1) {
    const { horizon, valeur } = objectifs[0];
    return `Objectif ${formatIndicateurPeriod(horizon)} : ${valeur} ${unite}`;
  }

  return libelle ?? 'Objectifs';
};

/**
 * Les objectifs de référence sont positionnés sur leur année-horizon. Leur
 * date ne représente pas une période d'observation mensuelle.
 */
export const prepareReferenceObjectifsDataset = ({
  valeurs,
  unite,
  libelle,
}: PrepareReferenceObjectifsDatasetInput): Dataset & {
  calculAuto: false;
  metadonnee: null;
  nomSource: string | null;
} => {
  const objectifs = normalizeIndicateurReferenceObjectifs(valeurs);
  return {
    color: LAYERS.cible.color,
    id: 'cible-objectifs',
    name: getObjectifReferenceName(objectifs, unite, libelle),
    source: objectifs.map(({ horizon, valeur }) => ({
      dateValeurISO: `${IndicateurPeriods.toDateValeur(horizon)}T00:00:00.000Z`,
      valeur,
    })),
    dimensions: ['dateValeurISO', 'valeur'],
    calculAuto: false,
    metadonnee: null,
    nomSource: libelle,
  };
};
