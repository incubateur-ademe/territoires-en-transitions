import {
  SelectMultiple,
  SelectMultipleProps,
} from '@design-system/Select/SelectMultiple';
import {OptionValue} from '@design-system/Select/components/Options';

/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/**
 * Sélecteur de valeur multiple
 *
 * Ajouter `isSearcheable`, `createProps` ou `onSearch` pour faire un Searchable select
 */
export const SelectFilter = ({
  values,
  options,
  onChange,
  ...props
}: SelectMultipleProps) => {
  const filterOptions = [{label: 'Tous', value: ITEM_ALL}, ...options];

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (selected: OptionValue, newValues?: OptionValue[]) => {
    if (selected === ITEM_ALL) {
      // onChange(ITEM_ALL);
      onChange(ITEM_ALL);
    } else {
      onChange(selected, newValues);
    }
  };

  return (
    <SelectMultiple
      values={values}
      options={filterOptions}
      onChange={handleChange}
      {...props}
    />
  );
};
