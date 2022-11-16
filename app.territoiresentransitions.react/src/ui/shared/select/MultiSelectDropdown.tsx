import classNames from 'classnames';
import {forwardRef, Ref} from 'react';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {
  buttonDisplayedClassname,
  buttonDisplayedPlaceholderClassname,
  Checkmark,
  ExpandCollapseIcon,
  optionButtonClassname,
  TSelectBase,
  TSelectDropdownBase,
  TSelectSelectionButtonBase,
} from 'ui/shared/select/commons';

type TMultiSelectDropdownBaseProps<T extends string> = TSelectBase & {
  /** valeurs des options sélectionnées */
  values?: T[];
  /** Expose les valeurs sélectionnées afin d'afficher un composant custom pour le bouton d'ouverture du menu*/
  renderSelection?: (values: T[]) => React.ReactElement;
};

export type TMultiSelectButtonProps<T extends string> =
  TMultiSelectDropdownBaseProps<T> & TSelectSelectionButtonBase;

export type TMultiSelectDropdownProps<T extends string> =
  TMultiSelectDropdownBaseProps<T> &
    TSelectDropdownBase<T> & {
      /** appelée quand les options sélectionnées changent (reçoit les nouvelles valeurs) */
      onSelect: (values: T[]) => void;
    };

/**
 * Permet de sélectionner plusieurs éléments dans une liste déroulante.
 */
const MultiSelectDropdown = <T extends string>({
  values,
  options,
  buttonClassName,
  placeholderText,
  onSelect,
  renderSelection,
  renderOption,
  placement,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => (
  <DropdownFloater
    placement={placement}
    render={() => (
      <div data-test={`${dataTest}-options`}>
        {options.map(({label, value: v}) => {
          return (
            <button
              key={v}
              data-test={v}
              className={optionButtonClassname}
              onClick={() => {
                if (values?.includes(v as T)) {
                  onSelect(
                    values.filter(selectedValue => selectedValue !== (v as T))
                  );
                } else {
                  onSelect([...(values || []), v as T]);
                }
              }}
            >
              <Checkmark isSelected={values?.includes(v as T) || false} />
              {renderOption ? (
                renderOption(v as T)
              ) : (
                <span className="leading-6">{label}</span>
              )}
            </button>
          );
        })}
      </div>
    )}
  >
    <MultiSelectButton
      buttonClassName={buttonClassName}
      options={options}
      values={values}
      placeholderText={placeholderText}
      renderSelection={
        renderSelection ? values => renderSelection(values as T[]) : undefined
      }
      data-test={dataTest}
    />
  </DropdownFloater>
);

export default MultiSelectDropdown;

/**
 * Bouton qui ouvre le dropdown menu
 * Création d'un composant séparé pour passer la ref du bouton au floater
 */
const MultiSelectButton = forwardRef(
  <T extends string>(
    {
      isOpen,
      values,
      options,
      buttonClassName,
      placeholderText,
      renderSelection,
      'data-test': dataTest,
      ...props
    }: TMultiSelectButtonProps<T>,
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
      {values && values?.length !== 0 ? (
        renderSelection ? (
          renderSelection(values)
        ) : (
          <span className="mr-auto flex line-clamp-1">
            {values.sort().map((value, index) => (
              <span key={value}>
                {options.find(({value: v}) => v === value)?.label || ''}
                {values.length !== index + 1 && ', '}
              </span>
            ))}
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
