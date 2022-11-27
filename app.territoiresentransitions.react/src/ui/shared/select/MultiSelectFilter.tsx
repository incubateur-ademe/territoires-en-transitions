import classNames from 'classnames';

import MultiSelectDropdown, {
  TMultiSelectDropdownProps,
} from 'ui/shared/select/MultiSelectDropdown';
import {getIsAllSelected, ITEM_ALL} from './commons';

/** Uncontroled multi select filter */
export const MultiSelectFilter = <T extends string>({
  values,
  options,
  buttonClassName,
  placeholderText,
  onSelect,
  renderSelection,
  renderOption,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => {
  const isAllSelected = values && getIsAllSelected(values);

  let labels = new Map<string, string>();
  options.forEach(({label, value}) => labels.set(value, label));

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
      renderOption={v =>
        renderOption ? (
          renderOption(v)
        ) : (
          <span
            className={classNames('pr-4 py-1', {
              'fr-text-mention--grey': v === ITEM_ALL,
            })}
          >
            {labels.get(v)}
          </span>
        )
      }
      renderSelection={renderSelection}
      placeholderText={placeholderText}
    />
  );
};
