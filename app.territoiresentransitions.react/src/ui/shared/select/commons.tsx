import {Placement} from '@floating-ui/react';
import {Icon} from '@tet/ui';
import classNames from 'classnames';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type TSelectOption = TOption | TOptionSection;
export type TOption = {value: string; label: string};
export type TOptionSection = {
  title: string;
  options: TOption[];
};

export type TSelectBase = {
  /** Liste des options */
  options: Array<TSelectOption>;
  /** Class pour customiser le bouton d'ouverture du menu */
  buttonClassName?: string;
  /** Text affiché dans l'input quand il n'y a rien sélectionné */
  placeholderText?: string;
  /** Change l'emplacement du dropdown menu */
  placement?: Placement;
  /** Pour que la largeur des options ne dépasse pas la largeur du bouton d'ouverture */
  containerWidthMatchButton?: boolean;
  /** Donne un id pour les tests e2e */
  'data-test'?: string;
  /** Permet de désactiver le bouton d'ouverture */
  disabled?: boolean;
};

export type TSelectSelectionButtonBase = {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
};

// Type guards
export function isOptionSection(
  option: TSelectOption
): option is TOptionSection {
  return (option as TOptionSection).title !== undefined;
}

export function isOption(option: TSelectOption): option is TOption {
  return (option as TOption).value !== undefined;
}

/** Extrait le label d'une option dans une liste d'options */
export const getOptionLabel = (optionValue: string, options: TOption[]) =>
  options.find((v: TOption) => v.value === optionValue)?.label!;

/** Renvoie un tableau d'options, quelles soient dans une section ou non */
export const getOptions = (selectOptions: TSelectOption[]): TOption[] => {
  if (selectOptions.length > 0) {
    if (isOptionSection(selectOptions[0])) {
      return selectOptions.reduce(
        (acc: TOption[], v) =>
          isOptionSection(v) ? acc.concat(v.options) : acc,
        []
      );
    } else {
      return selectOptions as unknown as TOption[];
    }
  } else {
    return [];
  }
};

export const sortOptionByAlphabet = (
  options: TSelectOption[]
): TSelectOption[] => {
  const optionArray: TOption[] = [];
  const sectionArray: TOptionSection[] = [];

  options.forEach(option => {
    if (isOption(option)) {
      optionArray.push(option);
    } else {
      sectionArray.push(option);
    }
  });

  // sort options
  optionArray.sort((a, b) => {
    let labelA = a.label.toUpperCase();
    let labelB = b.label.toUpperCase();
    if (labelA < labelB) {
      return -1;
    }
    if (labelA > labelB) {
      return 1;
    }
    return 0;
  });

  // sort sections
  sectionArray.forEach(section => {
    section.options.sort((a, b) => {
      let labelA = a.label.toUpperCase();
      let labelB = b.label.toUpperCase();
      if (labelA < labelB) {
        return -1;
      }
      if (labelA > labelB) {
        return 1;
      }
      return 0;
    });
  });

  return [...optionArray, ...sectionArray];
};

/**
 * Filtre les options, quelles soient dans une section ou non.
 * Utilisée dans les sélecteurs avec saisie.
 * Renvoi une liste d'options ou des sections avec les options filtrées
 */
export const filterOptions = (
  options: TSelectOption[],
  filterValue: string
): TSelectOption[] =>
  options.reduce((acc: TSelectOption[], currentOption) => {
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

/* Class génériques */
export const DSFRbuttonClassname = 'fr-select !flex !px-4 !bg-none !bg-grey975';
export const buttonDisplayedClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const buttonDisplayedPlaceholderClassname =
  'mr-auto text-grey425 line-clamp-1';
export const optionButtonClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const optionCheckMarkClassname = 'block fr-fi-check-line scale-75';

/** Affiche une marque de sélection (ou seulement son emplacement) devant un
 * item de la liste */
export const Checkmark = ({isSelected}: {isSelected: boolean}) => (
  <div className="w-6 mr-2 shrink-0">
    {isSelected ? <span className="block fr-fi-check-line scale-75" /> : null}
  </div>
);

/** Affiche l'icône plier/déplier */
export const ExpandCollapseIcon = ({isOpen}: {isOpen: boolean | undefined}) => (
  <Icon
    icon="arrow-down-s-line"
    size="lg"
    className={classNames('flex mt-1 ml-auto', {
      'rotate-180': isOpen,
    })}
  />
);
