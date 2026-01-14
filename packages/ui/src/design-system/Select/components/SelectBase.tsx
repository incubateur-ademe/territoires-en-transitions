import { Placement } from '@floating-ui/react';
import * as Sentry from '@sentry/nextjs';
import { Fragment, Ref, forwardRef, useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { cn } from '../../../utils/cn';
import { OpenState } from '../../../utils/types';
import { Badge, BadgeSize, BadgeState } from '../../Badge';
import { Icon } from '../../Icon';
import { Tooltip } from '../../Tooltip';
import {
  Option,
  OptionValue,
  SelectOption,
  filterOptions,
  getFlatOptions,
  getOptionLabel,
  isOptionSection,
  sortOptionByAlphabet,
} from '../utils';
import { DropdownFloater } from './DropdownFloater';
import Options from './Options';

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

export type SelectProps = {
  /** Id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: Array<SelectOption>;
  /** Appelée à la sélection d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: OptionValue) => void;
  /** Valeurs sélectionnées, peut recevoir une valeur seule ou un tableau de valeurs */
  values?: OptionValue | OptionValue[];
  /**
   * Permet de choisir combien de badges afficher et d'afficher un "+" avec le nombre de badges cachés
   * @deprecated Peut entrainer des problèmes d'affichage pour des valeurs avec beaucoup de texte ou des selecteurs pas très large. Déconseillé de mettre une value supérieure à 1 tant que ce n'est pas géré correctement.
   */
  maxBadgesToShow?: number;
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

  /** Permet de customiser l'item (label) d'une option */
  customItem?: (option: Option) => React.ReactElement;
  /** Si true, affiche l'item customisé dans les badges et dans la liste des options.
   * Si false, affiche l'item customisé seulement dans la liste des options */
  showCustomItemInBadges?: boolean;

  isBadgeItem?: boolean;
  /** Texte affiché quand aucune option ne correspond à la recherche */
  emptySearchPlaceholder?: string;
  /** Id du parent dans lequel doit être rendu le portal */
  parentId?: string;
  /** Change le positionnement du dropdown menu */
  placement?: Placement;
  /** Pour que la largeur des options ne dépasse pas la largeur du bouton d'ouverture */
  containerWidthMatchButton?: boolean;
  /** z-index custom pour le dropdown */
  dropdownZindex?: number;
  /** Affiche les options à la suite du bouton d'ouverture, sans élément flottant */
  displayOptionsWithoutFloater?: boolean;
  /** ClassName pour le bouton d'ouverture */
  buttonClassName?: string;
  /** Affiche une version plus petite du sélecteur */
  small?: boolean;
  /** Signale que l'on est dans le cas du composant <SelectBadge/> */
  isBadgeSelect?: boolean;
  /** Permet de modifier la taille des badges */
  badgeSize?: BadgeSize;
  /** Permet de modifier le state des badges en fonction de la valeur */
  valueToBadgeState?: Record<
    OptionValue,
    { state: BadgeState; light?: boolean }
  >;
  optionsAreCaseSensitive?: boolean;
  alwaysOpen?: boolean;
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
    maxBadgesToShow,
    openState,
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
    showCustomItemInBadges = true,
    isBadgeItem = false,
    parentId,
    containerWidthMatchButton = true,
    dropdownZindex,
    displayOptionsWithoutFloater,
    buttonClassName,
    disabled = false,
    small = false,
    isBadgeSelect = false,
    badgeSize = 'sm',
    valueToBadgeState,
    optionsAreCaseSensitive = false,
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
            Sentry.captureException(error);
          }
        });
      } else {
        if (!option.label) {
          const error = new Error(
            `Option with value ${option.value} has no label for select ${dataTest}`
          );
          console.error(error);
          Sentry.captureException(error);
        }
      }
    });
  }, [options]);

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
      openState={{
        isOpen: openState?.isOpen ?? false,
        setIsOpen:
          openState && 'setIsOpen' in openState
            ? openState.setIsOpen
            : () => {},
      }}
      parentId={parentId}
      placement={isBadgeSelect && !placement ? 'bottom-start' : placement}
      offsetValue={0}
      containerWidthMatchButton={containerWidthMatchButton}
      containerClassName={isBadgeSelect ? '!border-t rounded-t-lg mt-1' : ''}
      dropdownZindex={dropdownZindex}
      disabled={disabled}
      displayOptionsWithoutFloater={displayOptionsWithoutFloater}
      render={({ close }) => (
        <div data-test={dataTest && `${dataTest}-options`}>
          {/** Bouton de création d'une option */}
          {createProps?.onCreate &&
            inputValue.trim().length > 0 &&
            !inputValueAlreadyExistsInOptions && (
              <button
                type="button"
                data-test={dataTest && `${dataTest}-creer-tag`}
                className="flex gap-1 items-center w-full p-2 pr-6 text-left text-sm hover:!bg-primary-0 overflow-hidden"
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
                  state="default"
                  size="sm"
                  className="my-auto mr-auto"
                  uppercase={optionsAreCaseSensitive === false}
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
            onChange={(value) => {
              onChange(value);
              setInputValue('');
              if (!multiple) {
                close();
              }
            }}
            isLoading={loading}
            createProps={createProps}
            customItem={customItem}
            isBadgeItem={isBadgeItem || isBadgeSelect}
            badgeSize={badgeSize}
            valueToBadgeState={valueToBadgeState}
            noOptionPlaceholder={emptySearchPlaceholder}
            uppercase={optionsAreCaseSensitive === false}
          />
        </div>
      )}
    >
      <SelectButton
        dataTest={dataTest}
        values={arrayValues}
        maxBadgesToShow={maxBadgesToShow}
        options={options}
        onChange={onChange}
        isSearcheable={hasSearch}
        inputValue={inputValue}
        onSearch={handleInputChange}
        multiple={multiple}
        buttonClassName={buttonClassName}
        displayOptionsWithoutFloater={displayOptionsWithoutFloater}
        customItem={customItem}
        showCustomItemInBadges={showCustomItemInBadges}
        placeholder={placeholder}
        disabled={disabled}
        small={small}
        isBadgeSelect={isBadgeSelect}
        badgeSize={badgeSize}
        valueToBadgeState={valueToBadgeState}
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
      maxBadgesToShow = 1,
      onChange,
      inputValue,
      isSearcheable,
      onSearch,
      createProps,
      multiple,
      buttonClassName,
      customItem,
      showCustomItemInBadges,
      placeholder,
      disabled,
      small,
      isBadgeSelect,
      badgeSize,
      valueToBadgeState,
      optionsAreCaseSensitive,
      displayOptionsWithoutFloater,
      ...props
    }: Omit<SelectButtonProps, 'values'> & { values?: OptionValue[] },
    ref?: Ref<HTMLButtonElement>
  ) => {
    const [isInputFocused, setIsInputFocused] = useState(false);

    const flatOptions = getFlatOptions(options);

    const displayValue = (value: OptionValue, disableClose?: boolean) => {
      const option = flatOptions.find(
        (o) => o.value?.toString() === value.toString()
      );
      if (!option) {
        return null;
      }

      return customItem && showCustomItemInBadges ? (
        <Fragment key={value.toString()}>{customItem(option)}</Fragment>
      ) : (
        <Badge
          uppercase={optionsAreCaseSensitive === false}
          state={option?.disabled ? 'grey' : 'default'}
          icon={option.icon}
          iconPosition="left"
          iconClassname={option.iconClassname}
          key={value.toString()}
          title={option.label}
          onClose={
            !disableClose && !disabled && !option?.disabled
              ? () => onChange(value)
              : undefined
          }
        />
      );
    };

    const displayValues = (values: OptionValue[]) => {
      const badgesToDisplay = values.slice(0, maxBadgesToShow).map((value) => {
        return displayValue(value);
      });
      if (values.length > maxBadgesToShow) {
        return (
          <>
            {badgesToDisplay}
            <Tooltip
              placement="bottom"
              label={
                <div className="max-w-sm">
                  <div className="flex flex-wrap gap-2">
                    {values.map(
                      (value, index) =>
                        index >= maxBadgesToShow
                          ? displayValue(value, true)
                          : null // on ne veut pas que le badge soit cliquable dans le tooltip
                    )}
                  </div>
                </div>
              }
            >
              <div>
                <Badge
                  uppercase={optionsAreCaseSensitive === false}
                  title={`+${values.length - maxBadgesToShow}`}
                  state="info"
                />
              </div>
            </Tooltip>
          </>
        );
      }
      return badgesToDisplay;
    };

    return (
      <button
        ref={ref}
        data-test={dataTest}
        aria-expanded={isOpen}
        aria-label="ouvrir le menu"
        className={cn(
          'rounded-lg border border-solid border-grey-4 disabled:border-grey-3 bg-grey-1 hover:!bg-primary-0 disabled:hover:!bg-grey-1 overflow-hidden',
          {
            'rounded-b-none': isOpen,
            'w-full': !isBadgeSelect,
            'border-none rounded-none w-fit': isBadgeSelect,
          },
          { 'border-0 border-b': displayOptionsWithoutFloater },
          buttonClassName
        )}
        disabled={disabled}
        type="button"
        {...props}
        onKeyDown={(evt) => {
          /** Seul moyen trouvé pour ne pas prendre en compte la key "Space"
           * qui trigger le click du bouton et toggle le dropdown quand
           * l'utilisateur saisi un espace dans l'input.
           * Sinon il faudrait donner {...props} à l'input et non au bouton.
           * Mais quid des select sans input ainsi que toute la partie du bouton autour de l'input */
          if (isInputFocused && evt.code === 'Space') {
            evt.preventDefault();
            onSearch?.(inputValue + ' ');
          }
        }}
      >
        {isBadgeSelect ? (
          <Badge
            icon={isOpen ? 'arrow-up-s-line' : 'arrow-down-s-line'}
            size={badgeSize}
            state={
              values && valueToBadgeState
                ? valueToBadgeState[values[0]].state
                : undefined
            }
            light={
              values && valueToBadgeState
                ? valueToBadgeState[values[0]].light ?? false
                : false
            }
            title={
              values
                ? getOptionLabel(values[0], getFlatOptions(options)) ?? ''
                : ''
            }
            className="w-fit whitespace-nowrap"
            uppercase={optionsAreCaseSensitive === false}
          />
        ) : (
          <div
            className={cn('flex px-4', {
              'min-h-[2.5rem] py-1': small,
              'min-h-[3rem] py-2': !small,
            })}
          >
            <div className="flex grow flex-wrap gap-2 mr-4">
              {values && Array.isArray(values) && values.length > 0 ? (
                /** Listes des valeurs sélectionnées */
                <div className="flex items-center gap-2 grow">
                  {displayValues(values)}
                </div>
              ) : (
                /** Si pas de valeur et que la recherche n'est pas activée, on affiche un placeholder */
                !isSearcheable && (
                  <span
                    className={cn(
                      'my-auto text-left text-grey-6 line-clamp-1 text-xs',
                      { '!text-grey-5': disabled }
                    )}
                  >
                    {placeholder ??
                      (multiple
                        ? 'Sélectionner une ou plusieurs options'
                        : 'Sélectionner une option')}
                  </span>
                )
              )}
              {isSearcheable &&
                // on affiche l'input si le sélecteur est désactivé et ne possède pas de valeur
                // afin d'afficher le placeholder de l'input sinon uniquement les valeurs
                !(
                  disabled &&
                  values &&
                  Array.isArray(values) &&
                  values.length > 0
                ) && (
                  <input
                    data-test={`${dataTest}-input`}
                    type="text"
                    className={cn(
                      'w-full text-sm outline-0 placeholder:text-grey-6 placeholder:text-xs',
                      { 'py-1': values }
                    )}
                    value={inputValue}
                    onChange={(e) => {
                      onSearch?.(e.target.value);
                    }}
                    onClick={(evt) => {
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
                )}
            </div>
            {/** Icône flèche d'ouverture */}
            <Icon
              icon="arrow-down-s-line"
              size="sm"
              className={cn(
                'mt-2 ml-auto text-primary-9',
                { 'rotate-180': isOpen },
                { '!text-grey-5': disabled }
              )}
            />
          </div>
        )}
      </button>
    );
  }
);
SelectButton.displayName = 'SelectButton';
