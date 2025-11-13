import Fuse from 'fuse.js';

import { naturalSort } from '../../utils/naturalSort';
import { IconValue } from '../Icon';
import { ITEM_ALL, itemAllOption } from './SelectFilter';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */

/** Type du champ valeur d'une option */
export type OptionValue = number | string;
/** Type de base d'une option générique */
export type Option = {
  value: OptionValue;
  label: string;
  disabled?: boolean;
  icon?: IconValue;
  iconClassname?: string;
};
/** Type d'une liste d'options dans un sélecteur */
export type OptionSection = {
  title: string;
  options: Option[];
};
/** Type d'une option dans un sélecteur, peut être une simple option ou une liste d'options */
export type SelectOption = Option | OptionSection;

/** Option section type guards */
export function isOptionSection(option: SelectOption): option is OptionSection {
  return 'title' in option && option.title !== undefined;
}

/** Option type guards */
export function isSingleOption(option: SelectOption): option is Option {
  return 'value' in option && option.value !== undefined;
}

/** Renvoie un tableau d'options, quelles soient dans une section ou non */
export const getFlatOptions = (selectOptions: SelectOption[]): Option[] =>
  selectOptions.reduce(
    (acc: Option[], curr) =>
      acc.concat(isOptionSection(curr) ? curr.options : curr),
    []
  );

/** Extrait le label d'une option dans une liste d'options */
export const getOptionLabel = (optionValue: OptionValue, options: Option[]) =>
  options.find((v: Option) => v.value?.toString() === optionValue.toString())
    ?.label;

export const getCurrentOption = (optionValue: OptionValue, options: Option[]) =>
  options.find((v: Option) => v.value?.toString() === optionValue.toString());

/** Tri de façon naturelle (1, 2, 11, 40, 'a', 'b') une liste d'options par ordre alpha-numérique */
export const sortOptionByAlphabet = (
  options: SelectOption[]
): SelectOption[] => {
  // crée 2 tableaux pour les options et les section afin de leur appliquer le sort
  const optionArray: Option[] = [];
  const sectionArray: OptionSection[] = [];

  options.forEach((option) => {
    if (isSingleOption(option) && option.value !== ITEM_ALL) {
      optionArray.push(option);
    } else if (isOptionSection(option)) {
      sectionArray.push(option);
    }
  });

  // sort options
  optionArray.sort((a, b) =>
    naturalSort(a.label.toUpperCase(), b.label.toUpperCase())
  );

  // sort sections
  sectionArray.forEach((section) => {
    section.options.sort((a, b) =>
      naturalSort(a.label.toUpperCase(), b.label.toUpperCase())
    );
  });

  const sortedOptions = [...optionArray, ...sectionArray];

  /** Remet l'option de désélection au début de la liste si présente */
  if (getFlatOptions(options).some((o) => o.value === ITEM_ALL)) {
    return [itemAllOption, ...sortedOptions];
  }

  return sortedOptions;
};

/**
 * Filtre les options, quelles soient dans une section ou non.
 * Utilisée dans les sélecteurs avec saisie.
 * Renvoi une liste d'options ou des sections avec les options filtrées
 */
export const filterOptions = (
  options: SelectOption[],
  filterValue: string
): SelectOption[] => {
  if (filterValue.trim().length > 0) {
    const flatOptions = getFlatOptions(options);

    const fuse = new Fuse(flatOptions, {
      keys: ['label'],
      threshold: 0.5,
      shouldSort: false,
    });

    const fusedOptions = fuse.search(filterValue).map((r) => r.item);

    return options.reduce((acc: SelectOption[], currentOption) => {
      if (
        isSingleOption(currentOption) &&
        fusedOptions.includes(currentOption)
      ) {
        return [...acc, currentOption];
      }

      if (isOptionSection(currentOption)) {
        const filteredOptions = currentOption.options.filter((option) =>
          fusedOptions.includes(option)
        );
        return filteredOptions.length > 0
          ? [
              ...acc,
              {
                title: currentOption.title,
                options: filteredOptions,
              },
            ]
          : acc;
      }

      return acc;
    }, []);
  } else {
    return options;
  }
};
