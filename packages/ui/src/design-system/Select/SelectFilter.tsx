import {
  SelectMultiple,
  SelectMultipleProps,
} from '@design-system/Select/SelectMultiple';
import {OptionValue} from '@design-system/Select/components/Options';
import {useEffect, useState} from 'react';

/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/**
 * Sélecteur multiple pour filtrer une liste avec option "Tous"
 */
export const SelectFilter = ({
  values,
  options,
  onChange,
  ...props
}: SelectMultipleProps) => {
  const [filterOptions, setFilterOptions] = useState(options);

  useEffect(() => {
    if (values) {
      setFilterOptions([
        {label: 'Désélectionner toutes les options', value: ITEM_ALL},
        ...options,
      ]);
    } else {
      setFilterOptions(options);
    }
  }, [values]);

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (selected: OptionValue, newValues?: OptionValue[]) => {
    if (selected === ITEM_ALL) {
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
