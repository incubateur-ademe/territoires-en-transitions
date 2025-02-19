import { SelectMultiple } from '@/ui';
import {
  FILTRES_SOURCE,
  FiltresSource,
  SourceFilter,
} from '../data/use-source-filter';

const filtreToLabel: Record<FiltresSource, string> = {
  snbc: 'SNBC',
  opendata: 'Résultats Open data',
  pcaet: 'Territoires & Climat',
  collectivite: 'Données de la collectivité',
  /*
   moyenne: 'Moyenne',
   cible: 'Valeur cible',
   seuil: 'Valeur seuil',
   */
};

const OPTIONS = FILTRES_SOURCE.map((value) => ({
  value,
  label: filtreToLabel[value],
}));

/**
 * Affiche le sélecteur de source de données
 */
export const IndicateurSourcesSelect = ({
  sourceFilter,
}: {
  sourceFilter: SourceFilter;
}) => {
  const { filtresSource, setFiltresSource } = sourceFilter;
  return (
    <SelectMultiple
      maxBadgesToShow={FILTRES_SOURCE.length}
      options={OPTIONS}
      values={filtresSource}
      onChange={({values}) => setFiltresSource(values as FiltresSource[] || [])}
    />
  );
};
