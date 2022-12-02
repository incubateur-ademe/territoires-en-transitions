import {Placement} from '@floating-ui/react-dom-interactions';
import classNames from 'classnames';

/** constante pour gérer la sélection de tous les filtres */
export const ITEM_ALL = 'tous';

/** vérifie si ITEM_ALL est présent dans la liste de valeurs */
export const getIsAllSelected = (values: string[]) =>
  !values.length || values.includes(ITEM_ALL);

/** vérifie si ITEM_ALL n'est pas présent dans un filtre */
export const isValidFilter = (values: string[] | undefined | null) =>
  values?.length && !values.includes(ITEM_ALL);

/* Class génériques */
export const buttonDisplayedClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const buttonDisplayedPlaceholderClassname =
  'mr-auto text-gray-500 italic line-clamp-1';
export const buttonDisplayedIconClassname =
  'fr-fi-arrow-down-s-line mt-1 ml-1 scale-90';
export const optionButtonClassname =
  'flex items-center w-full p-2 text-left text-sm';
export const optionCheckMarkClassname = 'block fr-fi-check-line scale-75';

/**
 * Types partagés entre tous les composants selects
 * (Select, MultiSelect, MultiSelectFilter)
 */
export type TSelectBase = {
  /** Liste des options */
  options: Array<{value: string; label: string}>;
  /** Class pour customiser le bouton d'ouverture du menu */
  buttonClassName?: string;
  /** Text affiché dans l'input quand il n'y a rien sélectionné */
  placeholderText?: string;
  /** Change l'emplacement du dropdown menu */
  placement?: Placement;
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
  <div className="w-6 mr-2">
    {isSelected ? <span className="block fr-fi-check-line scale-75" /> : null}
  </div>
);

/** Affiche l'icône plier/déplier */
export const ExpandCollapseIcon = ({isOpen}: {isOpen: boolean | undefined}) => (
  <span
    className={classNames('fr-fi-arrow-down-s-line mt-1 ml-1 scale-90', {
      'rotate-180': isOpen,
    })}
  />
);
