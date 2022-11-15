import classNames from 'classnames';
import {ITEM_ALL} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFilters, TFiltreProps, TValueToBoundary} from './filters';

export const SCORE_REALISE = 'score_realise';

export const percentItems = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: '0', label: '0 à 34 %'},
  {value: '35', label: '35 à 49 %'},
  {value: '50', label: '50 à 64 %'},
  {value: '65', label: '65 à 74 %'},
  {value: '75', label: '75 à 100 %'},
];
export const percentBoundaries: TValueToBoundary = {
  '0': {lower: 0, upper: 0.35, include: 'lower'},
  '35': {lower: 0.35, upper: 0.5, include: 'lower'},
  '50': {lower: 0.5, upper: 0.65, include: 'lower'},
  '65': {lower: 0.65, upper: 0.75, include: 'lower'},
  '75': {lower: 0.75, upper: 1, include: 'both'},
};

export const makeFiltrePourcentage =
  (filterKey: string, label: string) => (props: TFiltreProps) => {
    const {filters, setFilters} = props;

    return (
      <MultiSelectFilter
        values={filters[filterKey as keyof TFilters]}
        options={percentItems}
        onSelect={newValues => setFilters({...filters, [filterKey]: newValues})}
        renderSelection={values => (
          <span
            className={classNames(
              'fr-fi--sm w-full text-center text-bf500 font-bold',
              {'fr-fi-filter-fill': values.includes(ITEM_ALL)},
              {'fr-fi-filter-line': !values.includes(ITEM_ALL)}
            )}
          >
            &nbsp;{label}
          </span>
        )}
      />
    );
  };
