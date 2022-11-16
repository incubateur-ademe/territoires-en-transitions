import classNames from 'classnames';
import {ITEM_ALL} from './commons';

export type TMultiSelectFilterTitleProps = {
  values: string[];
  label: string;
};

/**
 * Affiche le titre d'un filtre multi-sélection
 */
export const MultiSelectFilterTitle = (props: TMultiSelectFilterTitleProps) => {
  const {values, label} = props;
  return (
    <span
      className={classNames(
        'fr-fi--sm w-full text-center text-bf500 font-bold',
        {'fr-fi-filter-fill': values.includes(ITEM_ALL)},
        {'fr-fi-filter-line': !values.includes(ITEM_ALL)}
      )}
    >
      &nbsp;{label}
    </span>
  );
};
