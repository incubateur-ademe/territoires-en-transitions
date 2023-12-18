import {Placement} from '@floating-ui/react';
import {Ref, forwardRef} from 'react';
import classNames from 'classnames';

import DropdownFloater from '../../floating-ui/DropdownFloater';
import Options, {OptionValue, SelectOption} from './Options';

import {getOptions} from './utils';
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
  /** Afin de couplet avec un label */
  name?: string;
  /** Texte affiché quand rien n'est sélectionné */
  placeholder?: string;
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
    placement,
    multiple = false,
    containerWidthMatchButton = true,
    disabled = false,
  } = props;

  /** Transforme une valeur simple en tableau */
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
      render={({close}) => (
        <div
          data-test={`${dataTest}-options`}
          className="bg-white rounded-b-lg border border-grey-4 border-t-0 overflow-hidden"
        >
          <Options
            dataTest={dataTest}
            values={arrayValues}
            options={options}
            onChange={value => {
              onChange(value);
              if (!multiple) {
                close();
              }
            }}
          />
        </div>
      )}
    >
      <SelectButton
        dataTest={dataTest}
        values={values}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
      />
    </DropdownFloater>
  );
};

type SelectButtonProps<T extends OptionValue> = SelectProps<T> & {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectButton = forwardRef(
  <T extends OptionValue>(
    {
      dataTest,
      isOpen,
      values,
      options,
      multiple,
      placeholder,
      disabled,
      ...props
    }: SelectButtonProps<T>,
    ref?: Ref<HTMLButtonElement>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {onChange, ...otherProps} = props;

    return (
      <button
        ref={ref}
        data-test={dataTest}
        aria-expanded={isOpen}
        aria-label="ouvrir le menu"
        className={classNames(
          'flex items-center w-full min-h-[3rem] py-2 px-4 rounded-xl border border-solid border-grey-4 disabled:border-grey-3 bg-grey-1 hover:!bg-primary-0 disabled:hover:!bg-grey-1 overflow-hidden',
          {'rounded-b-none': isOpen}
        )}
        disabled={disabled}
        {...otherProps}
      >
        <div className="flex mr-4">
          {/** Listes des valeurs sélectionnées */}
          {values ? (
            // si le sélecteur multiple
            Array.isArray(values) ? (
              <div className="flex items-center gap-2">
                <Tag
                  trim
                  title={
                    getOptions(options).find(({value: v}) => v === values[0])
                      ?.label || ''
                  }
                  onClose={() => onChange(values[0])}
                />
                {values.length > 1 && (
                  <Tag
                    title={`+${values.length - 1}`}
                    className="bg-info-2 text-info-1"
                  />
                )}
              </div>
            ) : (
              // si sélecteur simple
              <Tag
                trim
                title={
                  getOptions(options).find(({value: v}) => v === values)
                    ?.label || ''
                }
                onClose={() => onChange(values)}
              />
            )
          ) : (
            /** Placeholder */
            <span
              className={classNames('text-xs text-grey-6 line-clamp-1', {
                '!text-grey-5': disabled,
              })}
            >
              {placeholder ?? multiple
                ? 'Sélectionner une ou plusieurs options'
                : 'Sélectionner une option'}
            </span>
          )}
        </div>
        {/** Icône flèche d'ouverture */}
        <span
          className={classNames(
            'flex ml-auto fr-icon-arrow-down-s-line text-primary-9 before:h-4 before:w-4',
            {'rotate-180': isOpen},
            {'text-grey-4': disabled}
          )}
        />
      </button>
    );
  }
);
SelectButton.displayName = 'SelectButton';
