import { useEffect, useState } from 'react';

import {
  SelectMultipleOnChangeArgs,
  SelectMultiple,
  SelectMultipleProps,
} from './SelectMultiple';
import { getFlatOptions } from '@tet/ui/design-system/Select/utils';

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

  /** Valeurs permanentes, associées à des options `disabled` */
  const permanentValues = values?.filter((v) =>
    getFlatOptions(options).some((o) => o.value === v && o.disabled)
  );

  useEffect(() => {
    /** Valeurs restantes lorsque l'on a retiré les valeurs permanentes */
    const otherValues = values?.filter((v) =>
      getFlatOptions(options).some((o) => o.value === v && !o.disabled)
    );

    if (values && otherValues && otherValues.length > 0) {
      setFilterOptions([
        { label: 'Désélectionner les options', value: ITEM_ALL },
        ...options,
      ]);
    } else {
      setFilterOptions(options);
    }
  }, [values, options]);

  // gère la sélection/déselection d'item dans la liste
  const handleChange = (args: SelectMultipleOnChangeArgs) => {
    if (args.selectedValue === ITEM_ALL) {
      if (permanentValues && permanentValues.length > 0) {
        onChange({ selectedValue: ITEM_ALL, values: permanentValues });
      } else {
        onChange({ selectedValue: ITEM_ALL });
      }
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
