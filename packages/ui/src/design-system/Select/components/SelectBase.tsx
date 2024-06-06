import {Placement} from '@floating-ui/react';
import {Ref, forwardRef, useEffect, useState} from 'react';
import classNames from 'classnames';
import {useDebouncedCallback} from 'use-debounce';

import {DropdownFloater} from '@design-system/Select/components/DropdownFloater';
import {Icon} from '@design-system/Icon';
import {Badge} from '@design-system/Badge';

import Options from './Options';
import {
  filterOptions,
  getOptionLabel,
  getFlatOptions,
  sortOptionByAlphabet,
  Option,
  OptionValue,
  SelectOption,
} from '../utils';

export type CreateOption = {
  userCreatedOptions: OptionValue[];
  onCreate?: (inputValue: string) => void;
  onDelete?: (id: OptionValue) => void;
  onUpdate?: (id: OptionValue, inputValue: string) => void;
};

export type SelectProps = {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: Array<SelectOption>;
  /** Appelée à la sélection d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: OptionValue) => void;
  /** Valeurs sélectionnées, peut recevoir une valeur seule ou un tableau de valeurs */
  values?: OptionValue | OptionValue[];
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
  /** Permet de customiser l'item (label) d'une option */
  customItem?: (option: Option) => React.ReactElement;
  isBadgeItem?: boolean;
  /** Texte affiché quand aucune option ne correspond à la recherche */
  emptySearchPlaceholder?: string;
  /** Id du parent dans lequel doit être rendu le portal */
  parentId?: string;
  /** Change le positionnement du dropdown menu */
  placement?: Placement;
  /** Pour que la largeur des options ne dépasse pas la largeur du bouton d'ouverture */
  containerWidthMatchButton?: boolean;
  /** Affiche une version plus petite du sélecteur */
  small?: boolean;
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
    options,
    onChange,
    createProps,
    onSearch,
    debounce = onSearch ? 250 : 0,
    placeholder,
    emptySearchPlaceholder,
    placement,
    multiple = false,
    isSearcheable = false,
    isLoading = false,
    customItem,
    isBadgeItem = false,
    parentId,
    containerWidthMatchButton = true,
    disabled = false,
    small = false,
  } = props;

  const hasSearch = isSearcheable || !!createProps || !!onSearch;

  /** Recherche textuelle locale car `onSearch` n'est pas obligatoire */
  const [inputValue, setInputValue] = useState('');

  /**
   * Permet de profiter du debounce de l'input et d'afficher un text de chargement
   * quand l'utilisateur est entrain de faire une saisie.
   */
  const [loading, setLoading] = useState(isLoading);
  // synchronise l'état de loading interne avec l'externe
  useEffect(() => setLoading(isLoading), [isLoading]);

  /** Fonction de debounce */
  const handleDebouncedInputChange = useDebouncedCallback(v => {
    onSearch(v);
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

  /** Compare la valeur de l'input de recherche avec la première optin de la liste
   * pour afficher le bouton de création d'une option */
  const isNotSimilar =
    inputValue.toLowerCase().trim() !==
    getFlatOptions(filteredOptions)[0]?.label.toLowerCase().trim();

  /** Transforme une valeur simple en tableau, qui est plus facile à traiter dans les sous composants */
  const arrayValues = values
    ? Array.isArray(values)
      ? values
      : [values]
    : undefined;

  return (
    <DropdownFloater
      parentId={parentId}
      placement={placement}
      offsetValue={0}
      containerWidthMatchButton={containerWidthMatchButton}
      disabled={disabled}
      render={({close}) => (
        <div data-test={`${dataTest}-options`}>
          {/** Bouton de création d'une option */}
          {createProps?.onCreate &&
            inputValue.trim().length > 0 &&
            isNotSimilar && (
              <button
                type="button"
                data-test={`${dataTest}-create-option`}
                className="flex w-full p-2 pr-6 text-left text-sm hover:!bg-primary-0 overflow-hidden"
                onClick={() => {
                  createProps.onCreate(inputValue);
                  handleInputChange('');
                }}
              >
                <div className="flex w-6 shrink-0 mt-1 mr-2">
                  <Icon
                    icon="add-line"
                    size="sm"
                    className="m-auto text-primary-7"
                  />
                </div>
                <Badge
                  title={inputValue}
                  state="standard"
                  size="sm"
                  className="my-auto mr-auto"
                />
                <span className="mt-1 ml-6 font-medium text-grey-8">Créer</span>
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
            onChange={value => {
              onChange(value);
              setInputValue('');
              if (!multiple) {
                close();
              }
            }}
            isLoading={loading}
            createProps={createProps}
            customItem={customItem}
            isBadgeItem={isBadgeItem}
            noOptionPlaceholder={emptySearchPlaceholder}
          />
        </div>
      )}
    >
      <SelectButton
        dataTest={dataTest}
        values={arrayValues}
        options={options}
        onChange={onChange}
        isSearcheable={hasSearch}
        inputValue={inputValue}
        onSearch={handleInputChange}
        createProps={createProps}
        multiple={multiple}
        customItem={customItem}
        placeholder={placeholder}
        disabled={disabled}
        small={small}
      />
    </DropdownFloater>
  );
};

type SelectButtonProps = SelectProps & {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
  /** Valeur de la saisie */
  inputValue: string;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectButton = forwardRef(
  (
    {
      dataTest,
      isOpen,
      options,
      values,
      onChange,
      inputValue,
      isSearcheable,
      onSearch,
      createProps,
      multiple,
      customItem,
      placeholder,
      disabled,
      small,
      ...props
    }: SelectButtonProps,
    ref?: Ref<HTMLButtonElement>
  ) => {
    const [isInputFocused, setIsInputFocused] = useState(false);

    return (
      <button
        ref={ref}
        data-test={dataTest}
        aria-expanded={isOpen}
        aria-label="ouvrir le menu"
        className={classNames(
          'w-full rounded-xl border border-solid border-grey-4 disabled:border-grey-3 bg-grey-1 hover:!bg-primary-0 disabled:hover:!bg-grey-1 overflow-hidden',
          {'rounded-b-none': isOpen}
        )}
        disabled={disabled}
        type="button"
        {...props}
        onKeyDown={evt => {
          /** Seul moyen trouvé pour ne pas prendre en compte la key "Space"
           * qui trigger le click du bouton et toggle le dropdown quand
           * l'utilisateur saisi un espace dans l'input.
           * Sinon il faudrait donner {...props} à l'input et non au bouton.
           * Mais quid des select sans input ainsi que toute la partie du bouton autour de l'input */
          if (isInputFocused && evt.code === 'Space') {
            evt.preventDefault();
            onSearch(inputValue + ' ');
          }
        }}
      >
        <div
          className={classNames('flex px-4', {
            'min-h-[2.5rem] py-1': small,
            'min-h-[3rem] py-2': !small,
          })}
        >
          <div className="flex grow flex-wrap gap-2 mr-4">
            {values && Array.isArray(values) ? (
              /** Listes des valeurs sélectionnées */
              <div className="flex items-center gap-2 grow">
                {customItem ? (
                  // Item custom
                  customItem({
                    value: values[0],
                    label: getOptionLabel(values[0], getFlatOptions(options)),
                  })
                ) : (
                  // Badge par défaut
                  <Badge
                    state={
                      createProps &&
                      createProps.userCreatedOptions.includes(values[0])
                        ? 'standard'
                        : 'default'
                    }
                    title={getOptionLabel(values[0], getFlatOptions(options))}
                    onClose={!disabled && (() => onChange(values[0]))}
                  />
                )}
                {/** Nombre de valeurs sélectionnées supplémentaires */}
                {values.length > 1 && (
                  <Badge title={`+${values.length - 1}`} state="info" />
                )}
              </div>
            ) : (
              /** Si pas de valeur et que la recherche n'est pas activée, on affiche un placeholder */
              !isSearcheable && (
                <span
                  className={classNames(
                    'my-auto text-left text-xs text-grey-6 line-clamp-1',
                    {
                      '!text-grey-5': disabled,
                    }
                  )}
                >
                  {placeholder ?? multiple
                    ? 'Sélectionner une ou plusieurs options'
                    : 'Sélectionner une option'}
                </span>
              )
            )}
            {
              // on affiche l'input si le sélecteur est désactivé et ne possède pas de valeur
              // afin d'afficher le placeholder de l'input
              isSearcheable && !(disabled && values) && (
                <input
                  type="text"
                  className={classNames(
                    'w-full text-sm outline-0 placeholder:text-grey-6',
                    {
                      'py-1': values,
                      'text-xs': small,
                    }
                  )}
                  value={inputValue}
                  onChange={e => {
                    onSearch(e.target.value);
                  }}
                  onClick={evt => {
                    evt.preventDefault();
                    if (isOpen) {
                      evt.stopPropagation();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={placeholder ?? 'Rechercher par mots-clés'}
                  disabled={disabled}
                />
              )
            }
          </div>
          {/** Icône flèche d'ouverture */}
          <Icon
            icon="arrow-down-s-line"
            size="sm"
            className={classNames(
              'mt-2 ml-auto text-primary-9',
              {'rotate-180': isOpen},
              {'!text-grey-5': disabled}
            )}
          />
        </div>
      </button>
    );
  }
);
SelectButton.displayName = 'SelectButton';
