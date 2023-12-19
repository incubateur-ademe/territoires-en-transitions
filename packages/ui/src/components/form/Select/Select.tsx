import {Placement} from '@floating-ui/react';
import {Ref, forwardRef, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import DropdownFloater from '../../floating-ui/DropdownFloater';
import Options, {OptionValue, SelectOption} from './Options';

import {filterOptions, getOptionLabel, getOptions} from './utils';
import {Tag} from '../../tag/Tag';

type SelectProps<T extends OptionValue> = {
  /** Donne un id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: Array<SelectOption>;
  /** Appelée au click d'une option (reçoit la valeur de l'option cliquée) */
  onChange: (value: T) => void;
  /** Valeurs sélectionnées, peut recevoir une valeur seule ou un tableau de valeurs */
  values?: T | T[];
  /** Active la multi sélection */
  multiple?: boolean;
  /** Permet la recherche dans la liste d'option */
  hasSearch?: boolean;
  /** Afin de couplet avec un label */
  name?: string;
  /** Texte affiché quand rien n'est sélectionné */
  placeholder?: string;
  /** Texte affiché quand aucune option ne correspond à la recherche */
  emptySearchPlaceholder?: string;
  /** Change l'emplacement du dropdown menu */
  placement?: Placement;
  /** Pour que la largeur des options ne dépasse pas la largeur du bouton d'ouverture */
  containerWidthMatchButton?: boolean;
  /** Permet de désactiver le bouton d'ouverture */
  disabled?: boolean;
};

/**
 * Composant multi-fonction:
 *
 * Select /
 * Multi select /
 * Input select /
 * Create option select
 */
export const Select = <T extends OptionValue>(props: SelectProps<T>) => {
  const {
    dataTest,
    values,
    options,
    onChange,
    placeholder,
    emptySearchPlaceholder,
    placement,
    multiple = false,
    hasSearch = false,
    containerWidthMatchButton = true,
    disabled = false,
  } = props;

  const [inputValue, setInputValue] = useState('');

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  /** Transforme une valeur simple en tableau, qui est plus facile à traiter dans les sous composants */
  const arrayValues = values
    ? Array.isArray(values)
      ? values
      : [values]
    : undefined;

  return (
    <DropdownFloater
      placement={placement}
      offsetValue={0}
      containerWidthMatchButton={containerWidthMatchButton}
      noDropdownStyles
      multipleClickToggle={!hasSearch}
      enterToToggle={!hasSearch}
      disabled={disabled}
      render={({close}) => (
        <div
          data-test={`${dataTest}-options`}
          className="bg-white rounded-b-lg border border-grey-4 border-t-0 overflow-hidden"
        >
          <Options
            dataTest={dataTest}
            values={arrayValues}
            options={filterOptions(options, inputValue)}
            onChange={value => {
              onChange(value);
              setInputValue('');
              if (!multiple) {
                close();
              }
            }}
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
        hasSearch={hasSearch}
        inputValue={inputValue}
        onInputChange={onInputChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </DropdownFloater>
  );
};

type SelectButtonProps<T extends OptionValue> = SelectProps<T> & {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
  /** Valeur de la saisie */
  inputValue: string;
  /** Change la valeur de saisie */
  onInputChange: (value: string) => void;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectButton = forwardRef(
  <T extends OptionValue>(
    {
      dataTest,
      isOpen,
      values,
      options,
      inputValue,
      hasSearch,
      onInputChange,
      multiple,
      placeholder,
      disabled,
      onChange,
      ...props
    }: SelectButtonProps<T>,
    ref?: Ref<HTMLButtonElement>
  ) => {
    const inputRef: Ref<HTMLInputElement> = useRef(null);

    /** donne le focus à l'input quand l'utilisateur click sur le bouton d'ouverture du Select */
    const handleWrapperClick = () => {
      inputRef?.current?.focus();
    };

    useEffect(() => {
      if (!isOpen) {
        onInputChange('');
      }
    }, [isOpen]);

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
        {...props}
      >
        {/**
         * Cette `div` englobant les sous composant permet d'appliquer la fonction pour forcer le focus sur l'input.
         * On ne peut pas l'appliquer sur le bouton car il reçoit déjà une propriété `onClick` du dropdown floater
         */}
        <div
          className="flex min-h-[3rem] py-2 px-4"
          onClick={handleWrapperClick}
        >
          <div className="flex grow flex-wrap gap-2 mr-4">
            {values && Array.isArray(values) ? (
              /** Listes des valeurs sélectionnées */
              <div className="flex items-center gap-2 grow">
                <Tag
                  className="text-left"
                  trim
                  title={getOptionLabel(values[0], getOptions(options))}
                  onClose={() => onChange(values[0])}
                  disabled={disabled}
                />
                {/** Nombre de valeurs sélectionnées supplémentaires */}
                {values.length > 1 && (
                  <Tag
                    title={`+${values.length - 1}`}
                    className="bg-info-2 text-info-1"
                  />
                )}
              </div>
            ) : (
              /** Si pas de valeur et que la recherche n'est pas activée, on affiche un placeholder */
              !hasSearch && (
                <span
                  className={classNames(
                    'my-auto text-xs text-grey-6 line-clamp-1',
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
            {hasSearch && (
              <input
                ref={inputRef}
                type="text"
                className={classNames(
                  'w-full text-sm outline-0 placeholder:text-grey-6',
                  {hidden: disabled && values} // on n'affiche pas l'input si le sélecteur est désactivé et possède une valeur
                )}
                value={inputValue}
                onChange={e => onInputChange(e.target.value)}
                placeholder={placeholder ?? 'Rechercher par mots-clés'}
                disabled={disabled}
              />
            )}
          </div>
          {/** Icône flèche d'ouverture */}
          <div className="mt-2 ml-auto">
            <span
              className={classNames(
                'flex fr-icon-arrow-down-s-line text-primary-9 before:h-4 before:w-4',
                {'rotate-180': isOpen},
                {'text-grey-4': disabled}
              )}
            />
          </div>
        </div>
      </button>
    );
  }
);
SelectButton.displayName = 'SelectButton';
