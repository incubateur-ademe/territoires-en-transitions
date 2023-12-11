import {Placement} from '@floating-ui/react';
import {Ref, forwardRef} from 'react';
import classNames from 'classnames';

import DropdownFloater from '../../floating-ui/DropdownFloater';
import Options, {SelectOption} from './Options';
import {getOptions} from './utils';
import {Tag} from '../../tag/Tag';

type SelectProps<T extends string> = {
  /** Donne un id pour les tests e2e */
  dataTest?: string;
  /** Liste des options */
  options: Array<SelectOption>;
  /** Appelée quand les options sélectionnées changent (reçoit les nouvelles valeurs) */
  onSelect: (values: T[]) => void;
  /** Valeurs sélectionnées, peut recevoir une valeur seule ou un tableau de valeurs */
  values?: T | T[];
  /** Active la multi sélection */
  isMulti?: boolean;
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
const Select = <T extends string>(props: SelectProps<T>) => {
  const {
    dataTest,
    values,
    options,
    onSelect,
    placeholder,
    placement,
    isMulti = false,
    containerWidthMatchButton = true,
    disabled = false,
  } = props;

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
            onSelect={values => {
              onSelect(isMulti ? values : [values[values.length - 1]]);
              if (!isMulti) {
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
        onSelect={onSelect as (values: string | string[]) => void}
      />
    </DropdownFloater>
  );
};

export default Select;

type SelectButtonProps<T extends string> = SelectProps<T> & {
  /** Donné par le DropdownFloater */
  isOpen?: boolean;
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectButton = forwardRef(
  <T extends string>(
    {
      dataTest,
      isOpen,
      values,
      options,
      isMulti,
      placeholder,
      disabled,
      ...props
    }: SelectButtonProps<T>,
    ref?: Ref<HTMLButtonElement>
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {onSelect, ...otherProps} = props;

    const arrayValues = values
      ? Array.isArray(values)
        ? values
        : [values]
      : undefined;

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
          {arrayValues && arrayValues.length > 0 ? (
            <div className="flex items-center gap-2">
              <Tag
                trim
                title={
                  getOptions(options).find(({value: v}) => v === arrayValues[0])
                    ?.label || ''
                }
                onClose={() =>
                  onSelect(arrayValues.filter(v => v !== arrayValues[0]))
                }
              />
              {arrayValues.length > 1 && (
                <Tag
                  title={`+${arrayValues.length - 1}`}
                  className="bg-info-2 text-info-1"
                />
              )}
            </div>
          ) : (
            /** Placeholder */
            <span
              className={classNames('text-xs text-grey-6 line-clamp-1', {
                '!text-grey-5': disabled,
              })}
            >
              {placeholder ?? isMulti
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
