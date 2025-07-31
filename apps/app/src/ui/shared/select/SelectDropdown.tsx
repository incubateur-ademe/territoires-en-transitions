import classNames from 'classnames';
import { forwardRef, Ref } from 'react';

import DropdownFloater from '@/app/ui/shared/floating-ui/DropdownFloater';
import {
  buttonDisplayedClassname,
  buttonDisplayedPlaceholderClassname,
  ExpandCollapseIcon,
  getOptions,
  TOption,
  TSelectBase,
  TSelectSelectionButtonBase,
} from '@/app/ui/shared/select/commons';
import Options from './Options';

type TSelectDropdownBaseProps<T extends string> = TSelectBase & {
  /** valeurs des options sélectionnées */
  value?: T;
  /** Expose la valeur sélectionnée afin d'afficher un composant custom pour le bouton d'ouverture du menu*/
  renderSelection?: (value: T) => React.ReactElement;
};

type TSelectButtonProps<T extends string> = TSelectDropdownBaseProps<T> &
  TSelectSelectionButtonBase;

export type TSelectDropdownProps<T extends string> =
  TSelectDropdownBaseProps<T> & {
    /** si à true, il n'est pas possible de déselectionner une valeur (optionnel) */
    required?: boolean;
    /** fait le rendu d'une option de la liste (optionnel) */
    renderOption?: (option: TOption) => React.ReactElement;
    /** appelée quand l'option sélectionnée change (reçoit la nouvelle valeur) */
    onSelect: (value: T) => void;
  };

const SelectDropdown = <T extends string>({
  value,
  options,
  onSelect,
  buttonClassName,
  containerWidthMatchButton,
  renderSelection,
  renderOption,
  placeholderText,
  placement,
  disabled,
  required = false,
  'data-test': dataTest,
}: TSelectDropdownProps<T>) => {
  return (
    <DropdownFloater
      containerWidthMatchButton={containerWidthMatchButton}
      placement={placement}
      render={({ close }) => (
        <div data-test={`${dataTest}-options`}>
          <Options
            dataTest={dataTest}
            values={value && [value]}
            options={options}
            onSelect={(values) => {
              // comme les options peuvent etre utilisées pour un select simple ou multiple,
              // on ne sélectionne que la dernière valeur du tableau
              if (values.length > 0 || (values.length === 0 && !required)) {
                onSelect(values[values.length - 1]);
              }
              close();
            }}
            renderOption={renderOption}
          />
        </div>
      )}
    >
      <SelectButtton
        data-test={dataTest}
        value={value}
        options={options}
        renderSelection={
          renderSelection ? (value) => renderSelection(value as T) : undefined
        }
        buttonClassName={buttonClassName}
        placeholderText={placeholderText}
        disabled={disabled}
      />
    </DropdownFloater>
  );
};

export default SelectDropdown;

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectButtton = forwardRef(
  <T extends string>(
    {
      isOpen,
      value,
      options,
      buttonClassName,
      placeholderText,
      renderSelection,
      disabled,
      'data-test': dataTest,
      ...props
    }: TSelectButtonProps<T>,
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      data-test={dataTest}
      aria-expanded={isOpen}
      aria-label="ouvrir le menu"
      className={classNames(buttonDisplayedClassname, buttonClassName)}
      disabled={disabled}
      {...props}
    >
      {value ? (
        renderSelection ? (
          renderSelection(value)
        ) : (
          <span className="mr-auto flex line-clamp-1">
            {getOptions(options).find(({ value: v }) => v === value)?.label ||
              ''}
          </span>
        )
      ) : (
        <span className={buttonDisplayedPlaceholderClassname}>
          {placeholderText ?? ''}
        </span>
      )}
      <ExpandCollapseIcon isOpen={isOpen} />
    </button>
  )
);

SelectButtton.displayName = 'SelectButtton';
