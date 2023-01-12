import {forwardRef, Ref, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {TMultiSelectDropdownProps} from 'ui/shared/select/MultiSelectDropdown';
import Tag from 'ui/shared/Tag';

import {
  buttonDisplayedClassname,
  Checkmark,
  ExpandCollapseIcon,
  getOptionLabel,
  optionButtonClassname,
  TSelectBase,
  TSelectSelectionButtonBase,
} from './commons';

/** Sélecteur avec un input dans le bouton d'ouverture pour faire une recherche dans la liste d'options */
const AutocompleteInputSelect = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  placement,
  placeholderText,
  containerWidthMatchButton,
  'data-test': dataTest,
}: TMultiSelectDropdownProps<T>) => {
  const [inputValue, setInputValue] = useState('');

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  const searchedOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <DropdownFloater
      containerWidthMatchButton={containerWidthMatchButton}
      placement={placement}
      toggle={false}
      enterToToggle={false}
      render={() => (
        <div data-test={`${dataTest}-options`}>
          {searchedOptions.map(({label, value: v}) => {
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
                    onInputChange('');
                  } else {
                    onSelect([...(values || []), v as T]);
                    onInputChange('');
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
      <AutocompleteButton
        data-test={dataTest}
        buttonClassName="fr-select !bg-none !flex !px-4"
        options={options}
        values={values}
        inputValue={inputValue}
        onInputChange={onInputChange}
        onSelect={onSelect as (values: string[]) => void}
        placeholderText={placeholderText}
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
                  title={getOptionLabel(v, options)}
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
            />
          </div>
          <ExpandCollapseIcon isOpen={isOpen} />
        </div>
      </div>
    );
  }
);
