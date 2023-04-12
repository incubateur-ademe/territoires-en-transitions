import {forwardRef, Ref, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {TMultiSelectDropdownProps} from 'ui/shared/select/MultiSelectDropdown';
import Tag from 'ui/shared/Tag';

import {
  buttonDisplayedClassname,
  ExpandCollapseIcon,
  filterOptions,
  getOptionLabel,
  getOptions,
  TSelectBase,
  TSelectSelectionButtonBase,
} from './commons';
import Options from './Options';

/** Sélecteur avec un input dans le bouton d'ouverture pour faire une recherche dans la liste d'options */
const AutocompleteInputSelect = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  placement,
  placeholderText,
  containerWidthMatchButton,
  disabled,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => {
  const [inputValue, setInputValue] = useState('');

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  return (
    <DropdownFloater
      containerWidthMatchButton={containerWidthMatchButton}
      placement={placement}
      toggle={false}
      enterToToggle={false}
      render={() => (
        <Options
          dataTest={dataTest}
          values={values}
          options={filterOptions(options, inputValue)}
          onSelect={values => {
            onSelect(values);
            onInputChange('');
          }}
          renderOption={renderOption}
        />
      )}
    >
      <AutocompleteButton
        data-test={dataTest}
        buttonClassName="fr-select !bg-none !flex !px-4"
        options={options}
        values={values}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSelect={onSelect as (values: string[]) => void}
        placeholderText={placeholderText}
        disabled={disabled}
      />
    </DropdownFloater>
  );
};

export default AutocompleteInputSelect;

export type TAutocompleteButtonProps<T extends string> = TSelectBase &
  TSelectSelectionButtonBase & {
    /** valeurs des options sélectionnées */
    values?: T[];
    inputValue: string;
    onInputChange: (value: string) => void;
    // onInputChange: (evt: ChangeEvent<HTMLInputElement>) => void;
    onSelect: (values: T[]) => void;
  };

/**
 * Bouton qui ouvre le dropdown menu
 * Création d'un composant séparé pour passer la ref du bouton au floater
 */
const AutocompleteButton = forwardRef(
  <T extends string>(
    {
      isOpen,
      values,
      options,
      buttonClassName,
      placeholderText,
      'data-test': dataTest,
      inputValue,
      onInputChange,
      onSelect,
      disabled,
      ...props
    }: TAutocompleteButtonProps<T>,
    ref?: Ref<HTMLDivElement>
  ) => {
    const inputRef: Ref<HTMLInputElement> = useRef(null);

    const handleWrapperClick = () => {
      inputRef?.current?.focus();
    };

    useEffect(() => {
      if (!isOpen) {
        onInputChange('');
      }
    }, [isOpen]);

    return (
      <div
        ref={ref}
        data-test={dataTest}
        aria-expanded={isOpen}
        aria-label="ouvrir le menu"
        {...props}
      >
        <div
          className={classNames(buttonDisplayedClassname, buttonClassName)}
          onClick={handleWrapperClick}
        >
          <div className="flex items-center flex-wrap gap-2 grow">
            {values &&
              values?.length !== 0 &&
              values.map(v => (
                <Tag
                  key={v}
                  title={getOptionLabel(v, getOptions(options))}
                  onCloseClick={() =>
                    onSelect(values.filter(value => value !== v))
                  }
                />
              ))}
            <input
              type="text"
              ref={inputRef}
              className={`grow text-sm placeholder:text-gray-500 placeholder:italic`}
              value={inputValue}
              placeholder={placeholderText}
              onChange={e => onInputChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <ExpandCollapseIcon isOpen={isOpen} />
        </div>
      </div>
    );
  }
);
