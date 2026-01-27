import MultiSelectDropdown, {
  TMultiSelectDropdownProps,
} from '@/app/ui/shared/select/MultiSelectDropdown';
import { Icon, ITEM_ALL } from '@tet/ui';

import { getIsAllSelected, getOptions } from './commons';

/** Uncontroled multi select filter */
export const MultiSelectFilter = <T extends string>({
  values,
  options,
  placeholderText,
  onSelect,
  renderSelection,
  renderOption,
  disabled,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => {
  const isAllSelected = values && getIsAllSelected(values);

  const labels = new Map<string, string>();
  getOptions(options).forEach(({ label, value }) => labels.set(value, label));

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
      onSelect(newValues.filter((f) => f !== ITEM_ALL));
    }
  };

  return (
    <MultiSelectDropdown
      data-test={dataTest}
      buttonClassName="hover:bg-grey-3"
      values={values}
      options={options}
      onSelect={handleChange}
      renderOption={(option) =>
        renderOption ? (
          renderOption(option)
        ) : (
          <span className="pr-4 py-1">{option.label}</span>
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
  const { values, label } = props;
  return (
    <span className="text-center font-bold mt-1">
      <Icon
        size="sm"
        className="text-primary-9"
        icon={values.includes(ITEM_ALL) ? 'filter-line' : 'filter-fill'}
      />
      &nbsp;{label}
    </span>
  );
};
