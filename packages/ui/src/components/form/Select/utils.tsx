import {Option, OptionSection, OptionValue, SelectOption} from './Options';

/** Option section type guards */
export function isOptionSection(option: SelectOption): option is OptionSection {
  return (option as OptionSection).title !== undefined;
}

/** Option type guards */
export function isOption(option: SelectOption): option is Option {
  type NewType = Option;
  return (option as NewType).value !== undefined;
}

/** Renvoie un tableau d'options, quelles soient dans une section ou non */
export const getOptions = (selectOptions: SelectOption[]): Option[] =>
  selectOptions.reduce(
    (acc: Option[], curr) =>
      acc.concat(isOptionSection(curr) ? curr.options : curr),
    []
  );

/** Extrait le label d'une option dans une liste d'options */
export const getOptionLabel = (optionValue: OptionValue, options: Option[]) =>
  options.find((v: Option) => v.value === optionValue).label;

/** Gère la sélection/désélection d'une valeur simple pour le composant Select */
export const onSelectSingle = (
  optionValue: OptionValue,
  value: OptionValue | undefined
) => {
  // si la valeur de l'option sélectionnée est différente de la valeur du sélecteur
  // (sélection)
  if (optionValue !== value) {
    // alors on renvoie la nouvelle valeur
    return optionValue;
    // sinon on retourne undefined
    // (désélection)
  } else {
    return undefined;
  }
};

/** Gère la sélection/désélection d'un tableau de valeurs pour le composant Select */
export const onSelectMultiple = (
  optionValue: OptionValue,
  values: OptionValue[] | undefined
) => {
  // si au moins une valeur est présente dans les valeurs du sélecteur
  if (values) {
    if (values.includes(optionValue)) {
      // retrait d'une valeur
      return values.length === 1
        ? // renvoie undefined si la seule valeur présente dans les valeurs du sélecteur est la même que la valeur de l'option
          undefined
        : values.filter(v => v !== optionValue);
    } else {
      // ajoût d'une valeur
      return [...values, optionValue];
    }
    // si aucune valeur n'était déjà sélectionnée alors on renvoie directement la veleur de l'option dans un tableau
  } else {
    return [optionValue];
  }
};

/**
 * Filtre les options, quelles soient dans une section ou non.
 * Utilisée dans les sélecteurs avec saisie.
 * Renvoi une liste d'options ou des sections avec les options filtrées
 */
export const filterOptions = (
  options: SelectOption[],
  filterValue: string
): SelectOption[] =>
  options.reduce((acc: SelectOption[], currentOption) => {
    if (isOption(currentOption)) {
      if (
        currentOption.label.toLowerCase().includes(filterValue.toLowerCase())
      ) {
        return [...acc, currentOption];
      }
    }

    if (isOptionSection(currentOption)) {
      const filteredOptions = currentOption.options.filter(option =>
        option.label.toLowerCase().includes(filterValue.toLowerCase())
      );
      if (filteredOptions.length > 0) {
        return [
          ...acc,
          {
            title: currentOption.title,
            options: filteredOptions,
          },
        ];
      } else {
        return acc;
      }
    }

    return acc;
  }, []);
