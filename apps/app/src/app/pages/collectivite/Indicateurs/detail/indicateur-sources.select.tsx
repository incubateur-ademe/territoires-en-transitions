import { SelectMultiple } from '@tet/ui';
import { FiltresSource, SourceFilter } from '../data/use-source-filter';

type Props = {
  sourceFilter: SourceFilter;
};

/**
 * Affiche le sélecteur de source de données
 */
export const IndicateurSourcesSelect = ({ sourceFilter }: Props) => {
  const { availableOptions, filtresSource, setFiltresSource, isLoading } =
    sourceFilter;
  return (
    <SelectMultiple
      isLoading={isLoading}
      dataTest="indicateurs.sources-select"
      maxBadgesToShow={availableOptions.length}
      options={availableOptions}
      values={filtresSource}
      onChange={({ values }) =>
        setFiltresSource((values as FiltresSource[]) || [])
      }
    />
  );
};
