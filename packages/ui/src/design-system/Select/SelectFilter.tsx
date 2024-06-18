import {useEffect, useState} from 'react';

import {
  SelectMultipleOnChangeArgs,
  SelectMultiple,
  SelectMultipleProps,
} from './SelectMultiple';

/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/** option complète ITEM_ALL */
export const itemAllOption = {
  label: 'Désélectionner les options',
  value: ITEM_ALL,
};

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
    if (values && Array.isArray(values) && values.length > 0) {
      setFilterOptions([
        {label: 'Désélectionner les options', value: ITEM_ALL},
        ...options,
      ]);
    } else {
      setFilterOptions(options);
    }
  }, [values, options]);

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (args: SelectMultipleOnChangeArgs) => {
    if (args.selectedValue === ITEM_ALL) {
      onChange({selectedValue: ITEM_ALL});
    } else {
      onChange(args);
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
