import classNames from 'classnames';
import {forwardRef, Ref} from 'react';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {
  buttonDisplayedClassname,
  buttonDisplayedPlaceholderClassname,
  optionButtonClassname,
  Checkmark,
  ExpandCollapseIcon,
  TSelectBase,
  TSelectDropdownBase,
  TSelectSelectionButtonBase,
} from 'ui/shared/select/commons';

type TSelectDropdownBaseProps<T extends string> = TSelectBase & {
  /** valeurs des options sélectionnées */
  value?: T;
  /** Expose la valeur sélectionnée afin d'afficher un composant custom pour le bouton d'ouverture du menu*/
  renderSelection?: (value: T) => React.ReactElement;
};

type TSelectButtonProps<T extends string> = TSelectDropdownBaseProps<T> &
  TSelectSelectionButtonBase;

export type TSelectDropdownProps<T extends string> =
  TSelectDropdownBaseProps<T> &
    TSelectDropdownBase<T> & {
      /** appelée quand l'option sélectionnée change (reçoit la nouvelle valeur) */
      onSelect: (value: T) => void;
    };

const SelectDropdown = <T extends string>({
  value,
  options,
  onSelect,
  buttonClassName,
  renderSelection,
  renderOption,
  placeholderText,
  placement,
  'data-test': dataTest,
}: TSelectDropdownProps<T>) => {
  return (
    <DropdownFloater
      placement={placement}
      render={({close}) => (
        <div data-test={`${dataTest}-options`}>
          {options.map(v => {
            return (
              <button
                key={v.value}
                data-test={v.value}
                className={optionButtonClassname}
                onClick={() => {
                  onSelect(v.value as T);
                  close();
                }}
              >
                <Checkmark isSelected={value === v.value} />
                {renderOption ? (
                  renderOption(v.value as T)
                ) : (
                  <span>{v.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    >
      <SelectButtton
        data-test={dataTest}
        value={value}
        options={options}
        renderSelection={
          renderSelection ? value => renderSelection(value as T) : undefined
        }
        buttonClassName={buttonClassName}
        placeholderText={placeholderText}
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
      {...props}
    >
      {value ? (
        renderSelection ? (
          renderSelection(value)
        ) : (
          <span className="mr-auto flex line-clamp-1">
            {options.find(({value: v}) => v === value)?.label || ''}
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
