import {Placement} from '@floating-ui/react';
import classNames from 'classnames';

/** Extrait le label d'une option dans une liste d'options */
export const getOptionLabel = (optionValue: string, options: TOption[]) =>
  options.find((v: TOption) => v.value === optionValue)?.label!;

/* Class génériques */
export const DSFRbuttonClassname = 'fr-select !flex !px-4 !bg-none';
export const buttonDisplayedClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const buttonDisplayedPlaceholderClassname =
  'mr-auto text-gray-500 italic line-clamp-1';
export const buttonDisplayedIconClassname =
  'fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 ml-auto';
export const optionButtonClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const optionCheckMarkClassname = 'block fr-fi-check-line scale-75';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type TOption = {value: string; label: string};

export type TSelectBase = {
  /** Liste des options */
  options: Array<TOption>;
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

export type TSelectDropdownBase<T extends string> = {
  /** fait le rendu d'une option de la liste (optionnel) */
  renderOption?: (value: T) => React.ReactElement;
};

/** Affiche une marque de sélection (ou seulement son emplacement) devant un
 * item de la liste */
export const Checkmark = ({isSelected}: {isSelected: boolean}) => (
  <div className="w-6 mr-2 shrink-0">
    {isSelected ? <span className="block fr-fi-check-line scale-75" /> : null}
  </div>
);

/** Affiche l'icône plier/déplier */
export const ExpandCollapseIcon = ({isOpen}: {isOpen: boolean | undefined}) => (
  <span
    className={classNames(buttonDisplayedIconClassname, {
      'rotate-180': isOpen,
    })}
  />
);
