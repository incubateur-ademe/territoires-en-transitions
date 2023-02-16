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

type TSelectCreateTagsDropdown<T extends string> =
  TMultiSelectDropdownProps<T> & {
    onCreateClick: (value: string) => void;
  };

/** Sélecteur de Tag(s) avec un input dans le bouton d'ouverture pour créer un tag */
const SelectCreateTagsDropdown = <T extends string>({
  values,
  options,
  onSelect,
  onCreateClick,
  renderOption,
  placement,
  placeholderText,
  disabled,
  'data-test': dataTest,
}: TSelectCreateTagsDropdown<T>) => {
  const [inputValue, setInputValue] = useState('');

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase().trim())
  );

  const isNotSimilar =
    inputValue.toLowerCase().trim() !==
    filteredOptions[0]?.label.toLowerCase().trim();

  return (
    <DropdownFloater
      placement={placement}
      toggle={false}
      enterToToggle={false}
      render={() => (
        <div data-test={`${dataTest}-options`}>
          {inputValue.trim().length > 0 && isNotSimilar && (
            <button
              className={classNames('pl-10', optionButtonClassname)}
              onClick={() => {
                onCreateClick(inputValue);
                onInputChange('');
              }}
            >
              <span className="mr-2">Créer</span>{' '}
              <Tag
                title={inputValue}
                className="bg-indigo-100 text-indigo-700"
              />
            </button>
          )}
          {filteredOptions.map(({label, value: v}) => {
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
                {renderOption ? renderOption(v as T) : <Tag title={label} />}
              </button>
            );
          })}
        </div>
      )}
    >
      <SelectCreateTagsButton
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

export default SelectCreateTagsDropdown;

export type TSelectCreateTagsButtonProps<T extends string> = TSelectBase &
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
const SelectCreateTagsButton = forwardRef(
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
    }: TSelectCreateTagsButtonProps<T>,
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
              disabled={disabled}
            />
          </div>
          <ExpandCollapseIcon isOpen={isOpen} />
        </div>
      </div>
    );
  }
);
