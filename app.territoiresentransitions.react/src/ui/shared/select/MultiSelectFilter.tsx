import classNames from 'classnames';

import MultiSelectDropdown, {
  TMultiSelectDropdownProps,
} from 'ui/shared/select/MultiSelectDropdown';
import {getIsAllSelected, ITEM_ALL} from '../filters/commons';
import {getOptions} from './commons';

/** Uncontroled multi select filter */
export const MultiSelectFilter = <T extends string>({
  values,
  options,
  buttonClassName,
  placeholderText,
  onSelect,
  renderSelection,
  renderOption,
  disabled,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => {
  const isAllSelected = values && getIsAllSelected(values);

  let labels = new Map<string, string>();
  getOptions(options).forEach(({label, value}) => labels.set(value, label));

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (newValues: T[]) => {
    // évite d'avoir aucun item sélectionné
    if (!newValues.length) {
      if (!isAllSelected) {
        onSelect([ITEM_ALL as T]);
      } else {
        return;
      }
    }
    const newValuesIncludesAll = getIsAllSelected(newValues);
    // supprime les autres items de la sélection quand "tous" est sélectionné
    if (newValuesIncludesAll && !isAllSelected) {
      onSelect([ITEM_ALL as T]);
    } else {
      // sinon évite que "tous" reste dans la nouvelle sélection
      onSelect(newValues.filter(f => f !== ITEM_ALL));
    }
  };

  return (
    <MultiSelectDropdown
      data-test={dataTest}
      buttonClassName={buttonClassName}
      values={values}
      options={options}
      onSelect={handleChange}
      renderOption={option =>
        renderOption ? (
          renderOption(option)
        ) : (
          <span
            className={classNames('pr-4 py-1', {
              'fr-text-mention--grey': option.label === ITEM_ALL,
            })}
          >
            {option.label}
          </span>
        )
      }
      renderSelection={renderSelection}
      placeholderText={placeholderText}
      disabled={disabled}
    />
  );
};

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
        {'fr-fi-filter-fill': !values.includes(ITEM_ALL)},
        {'fr-fi-filter-line': values.includes(ITEM_ALL)}
      )}
    >
      &nbsp;{label}
    </span>
  );
};
