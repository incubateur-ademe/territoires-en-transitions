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

type TMultiSelectDropdownBaseProps<T extends string> = TSelectBase & {
  /** valeurs des options sélectionnées */
  values?: T[];
  /** Expose les valeurs sélectionnées afin d'afficher un composant custom pour le bouton d'ouverture du menu*/
  renderSelection?: (values: T[]) => React.ReactElement;
};

export type TMultiSelectButtonProps<T extends string> =
  TMultiSelectDropdownBaseProps<T> & TSelectSelectionButtonBase;

export type TMultiSelectDropdownProps<T extends string> =
  TMultiSelectDropdownBaseProps<T> & {
    /** fait le rendu d'une option de la liste (optionnel) */
    renderOption?: (option: TOption) => React.ReactElement;
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
  containerWidthMatchButton,
  placeholderText = 'Sélectionnez une ou plusieurs options',
  onSelect,
  renderSelection,
  renderOption,
  placement,
  disabled,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => (
  <DropdownFloater
    containerWidthMatchButton={containerWidthMatchButton}
    placement={placement}
    render={() => (
      <Options
        dataTest={dataTest}
        values={values}
        options={options}
        onSelect={onSelect}
        renderOption={renderOption}
      />
    )}
  >
    <MultiSelectButton
      buttonClassName={classNames(buttonClassName)}
      options={options}
      values={values}
      placeholderText={placeholderText}
      renderSelection={
        renderSelection ? (values) => renderSelection(values as T[]) : undefined
      }
      data-test={dataTest}
      disabled={disabled}
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
      disabled,
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
      disabled={disabled}
      type="button"
      {...props}
    >
      {values && values?.length !== 0 ? (
        renderSelection ? (
          renderSelection(values)
        ) : (
          <span className="mr-auto flex line-clamp-1">
            {values.sort().map((value, index) => (
              <span key={value}>
                {getOptions(options).find(({ value: v }) => v === value)
                  ?.label || ''}
                {values.length !== index + 1 && ', '}
              </span>
            ))}
          </span>
        )
      ) : (
        <span className={buttonDisplayedPlaceholderClassname}>
          {placeholderText}
        </span>
      )}
      <ExpandCollapseIcon isOpen={isOpen} />
    </button>
  )
);

MultiSelectButton.displayName = 'MultiSelectButton';
