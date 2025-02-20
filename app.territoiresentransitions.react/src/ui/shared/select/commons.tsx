import { Icon } from '@/ui';
import { Placement } from '@floating-ui/react';
import classNames from 'classnames';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type TSelectOption = TOption | TOptionSection;
export type TOption = { value: string; label: string };
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

/* Class génériques */
export const buttonDisplayedClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const buttonDisplayedPlaceholderClassname =
  'mr-auto text-grey425 line-clamp-1';

/** Affiche une marque de sélection (ou seulement son emplacement) devant un
 * item de la liste */
export const Checkmark = ({ isSelected }: { isSelected: boolean }) => (
  <div className="w-6 mr-2 shrink-0 flex">
    {isSelected && <Icon icon="check-line" />}
  </div>
);

/** Affiche l'icône plier/déplier */
export const ExpandCollapseIcon = ({
  isOpen,
}: {
  isOpen: boolean | undefined;
}) => (
  <Icon
    icon="arrow-down-s-line"
    size="lg"
    className={classNames('flex mt-1 ml-auto', {
      'rotate-180': isOpen,
    })}
  />
);
