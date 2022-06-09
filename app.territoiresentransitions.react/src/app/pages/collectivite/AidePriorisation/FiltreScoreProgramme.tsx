import {MultiSelectFilter} from 'ui/shared/MultiSelectFilter';
import {TFiltreProps} from './filters';
import {percentItems} from './FiltreScoreRealise';

export const SCORE_PROGRAMME = 'score_programme';

/**
 * Affiche le filtre par score programmé
 */
export const FiltreScoreProgramme = (props: TFiltreProps) => {
  const {className, filters, setFilters} = props;

  return (
    <MultiSelectFilter
      className={`filtre-programme ${className || ''}`}
      label="% Programmé"
      values={filters[SCORE_PROGRAMME]}
      items={percentItems}
      onChange={newValues =>
        setFilters({...filters, [SCORE_PROGRAMME]: newValues})
      }
    />
  );
};
