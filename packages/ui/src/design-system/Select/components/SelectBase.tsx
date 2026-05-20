import { uiLabels } from '@tet/ui/labels/catalog';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { OpenState } from '../../../utils/types';
import { Badge } from '../../Badge';
import { Icon } from '../../Icon';
import {
  Option,
  OptionValue,
  SelectOption,
  filterOptions,
  getFlatOptions,
  isOptionSection,
  sortOptionByAlphabet,
} from '../utils';
import { DropdownFloater, DropdownFloaterProps } from './DropdownFloater';
import Options from './Options';
import { SelectBaseButton } from './select.base-button';

export type CreateOption = {
  userCreatedOptions: OptionValue[];
  onCreate?: (inputValue: string) => void;
  onDelete?: (id: OptionValue) => void;
  /** Permet la customisation de la modale delete */
  deleteModal?: { title?: string; message?: string };
  onUpdate?: (id: OptionValue, inputValue: string) => void;
  /** Permet la customisation de la modale d'update */
  updateModal?: { title?: string; fieldTitle?: string };
};

export type SelectCustomization = {
  /** Element affiché dans le bouton pour les valeurs sélectionnées */
  renderValueItem?: (option: Option) => React.ReactElement;
  /** Element affiché dans une option de la liste */
  renderOptionItem?: (option: Option) => React.ReactElement;
  /**
   * Si true et renderOptionItem est défini mais pas renderValueItem,
   * utilise renderOptionItem pour les valeurs.
   * Par défaut: true si renderOptionItem est défini et renderValueItem ne l'est pas.
   */
  valueMatchOption?: boolean;
  /** Bouton déclencheur personnalisé (remplace le bouton par défaut) */
  triggerButton?: React.ReactElement;
  /** Largeur maximale du container d'options (utilisé avec triggerButton) */
  containerMaxWidth?: React.CSSProperties['maxWidth'];
};

export type SelectProps = Pick<DropdownFloaterProps, 'inlineEdit'> & {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: Array<SelectOption>;
  /** Appelée à la sélection d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: OptionValue) => void;
  /** Valeurs sélectionnées, peut recevoir une valeur seule ou un tableau de valeurs */
  values?: OptionValue | OptionValue[];
  /** État d'ouverture du dropdown */
  openState?: OpenState | { isOpen: boolean };
  /** Active la multi sélection */
  multiple?: boolean;
  /** Permet la recherche dans la liste d'option */
  isSearcheable?: boolean;
  /** Fonction exécutée lorsque l'utilisateur fait une recherche, reçoit la valeur de l'input */
  onSearch?: (v: string) => void;
  /** Temps du debounce appliqué à onSearch */
  debounce?: number;
  /** Les propriétés permettant la création de nouvelles options */
  createProps?: CreateOption;
  /** Fait apparaître un état de chargement à la place des options */
  isLoading?: boolean;
  /** Permet de désactiver le bouton d'ouverture */
  disabled?: boolean;
  /** Texte affiché quand rien n'est sélectionné */
  placeholder?: string;
  /** Permet de customiser différents éléments du Select */
  custom?: SelectCustomization;
  /** Désactive la limite d'affichage des badges valeurs */
  disableDisplayedValueLimit?: boolean;
  /** z-index custom pour le dropdown */
  dropdownZindex?: number;
  /** ClassName pour le bouton d'ouverture */
  buttonClassName?: string;
  /** Affiche une version plus petite du sélecteur */
  small?: boolean;
  optionsAreCaseSensitive?: boolean;
};

/**
 * Composant multi-fonction:
 *
 * Select /
 * Multi select /
 * Searchable select /
 * Create option select
 *
 * Mettre `multiple` à `true` pour faire un multi select
 *
 * Ajouter `isSearcheable`, `createProps` ou `onSearch` pour faire un Searchable select
 *
 * Donner `createProps` pour faire un Create option select, cela active `isSearcheable' automatiquement
 */
export const SelectBase = (props: SelectProps) => {
  const {
    dataTest,
    values,
    disableDisplayedValueLimit,
    openState,
    options,
    onChange,
    createProps,
    onSearch,
    debounce = onSearch ? 250 : 0,
    placeholder,
    multiple = false,
    isSearcheable = false,
    isLoading = false,
    custom,
    dropdownZindex,
    inlineEdit,
    buttonClassName,
    disabled = false,
    small = false,
    optionsAreCaseSensitive = false,
  } = props;

  const hasTriggerButton = !!custom?.triggerButton;

  const renderOptionItem = custom?.renderOptionItem ?? undefined;

  const shouldValueMatchOption =
    custom?.valueMatchOption ??
    (custom?.renderOptionItem && !custom?.renderValueItem);

  const renderValueItem =
    custom?.renderValueItem ??
    (shouldValueMatchOption ? renderOptionItem : undefined) ??
    undefined;

  const hasSearch = isSearcheable || !!createProps || !!onSearch;

  /** Recherche textuelle locale car `onSearch` n'est pas obligatoire */
  const [inputValue, setInputValue] = useState('');

  /**
   * Permet de profiter du debounce de l'input et d'afficher un text de chargement
   * quand l'utilisateur est entrain de faire une saisie.
   */
  const [loading, setLoading] = useState(isLoading);
  // synchronise l'état de loading interne avec l'externe
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLoading(isLoading), [isLoading]);

  /** Fonction de debounce */
  const handleDebouncedInputChange = useDebouncedCallback((v) => {
    onSearch?.(v);
    setLoading(false);
  }, debounce);

  /** Permet synchroniser les différents inputChange */
  const handleInputChange = (value: string) => {
    setInputValue(value);
    // uniquement si la fonction `onSearch` est donnée
    // on applique la fonction de `debounce`, par défaut le debounce est à 0
    if (onSearch) {
      // on active le loading sachant qu'on le désactive à la fin de la fct de debounce
      setLoading(true);
      handleDebouncedInputChange(value);
    }
  };

  /** Liste d'option filtrée par la saisie de l'utilisateur (sauf si une
   * fonction de filtrage externe est fournie) */
  const filteredOptions = onSearch
    ? options
    : filterOptions(options, inputValue);

  useEffect(() => {
    options.forEach((option) => {
      if (isOptionSection(option)) {
        option.options.forEach((subopt) => {
          if (!subopt.label) {
            const error = new Error(
              `Option with value ${subopt.value} has no label for select ${dataTest}`
            );
            console.error(error);
          }
        });
      } else {
        if (!option.label) {
          const error = new Error(
            `Option with value ${option.value} has no label for select ${dataTest}`
          );
          console.error(error);
        }
      }
    });
  }, [dataTest, options]);

  /** Compare la valeur de l'input de recherche avec la première option de la liste
   * pour afficher le bouton de création d'une option */
  const inputValueAlreadyExistsInOptions = getFlatOptions(filteredOptions)
    .map((option) => option.label?.toLowerCase().trim())
    .includes(inputValue.toLowerCase().trim());

  /** Transforme une valeur simple en tableau, qui est plus facile à traiter dans les sous composants */
  const arrayValues = values
    ? Array.isArray(values)
      ? values
      : [values]
    : undefined;

  return (
    <DropdownFloater
      openState={openState}
      offsetValue={hasTriggerButton ? 8 : 0}
      dropdownZindex={dropdownZindex}
      disabled={disabled}
      inlineEdit={inlineEdit}
      containerWidthMatchButton={!hasTriggerButton}
      hasTriggerButton={hasTriggerButton}
      containerMaxWidth={custom?.containerMaxWidth}
      render={({ close }) => (
        <div data-test={dataTest && `${dataTest}-options`}>
          {/** Bouton de création d'une option */}
          {createProps?.onCreate &&
            inputValue.trim().length > 0 &&
            !inputValueAlreadyExistsInOptions && (
              <button
                type="button"
                data-test={dataTest && `${dataTest}-creer-tag`}
                className="flex gap-1 items-center w-full p-2 pr-6 text-left text-sm hover:bg-primary-0 overflow-hidden"
                onClick={() => {
                  createProps.onCreate?.(inputValue);
                  handleInputChange('');
                }}
              >
                <div className="flex w-6 shrink-0">
                  <Icon
                    icon="add-line"
                    size="sm"
                    className="m-auto text-primary-7"
                  />
                </div>
                <Badge
                  title={inputValue}
                  variant="default"
                  type="outlined"
                  size="xs"
                  className="my-auto mr-auto"
                  uppercase={optionsAreCaseSensitive === false}
                />
                <span className="mt-1 ml-6 font-medium text-grey-8">
                  {uiLabels.creer}
                </span>
              </button>
            )}
          {/** Liste des options */}
          <Options
            values={arrayValues}
            options={
              createProps
                ? sortOptionByAlphabet(filteredOptions)
                : filteredOptions
            }
            onChange={(value) => {
              onChange(value);
              setInputValue('');
              if (!multiple) {
                close();
              }
            }}
            isLoading={loading}
            createProps={createProps}
            renderOptionItem={renderOptionItem}
            uppercase={optionsAreCaseSensitive === false}
            autoFocusOnOpen={inlineEdit === false}
          />
        </div>
      )}
    >
      {hasTriggerButton && custom?.triggerButton ? (
        custom.triggerButton
      ) : (
        <SelectBaseButton
          dataTest={dataTest}
          values={arrayValues}
          disableDisplayedValueLimit={disableDisplayedValueLimit}
          options={options}
          onChange={onChange}
          isSearcheable={hasSearch}
          inputValue={inputValue}
          onSearch={handleInputChange}
          multiple={multiple}
          buttonClassName={buttonClassName}
          inlineEdit={inlineEdit}
          renderValueItem={renderValueItem}
          placeholder={placeholder}
          disabled={disabled}
          small={small}
        />
      )}
    </DropdownFloater>
  );
};
