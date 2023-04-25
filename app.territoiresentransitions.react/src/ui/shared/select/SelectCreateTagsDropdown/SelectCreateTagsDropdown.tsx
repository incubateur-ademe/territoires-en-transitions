import {forwardRef, Ref, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';

import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import {TMultiSelectDropdownProps} from 'ui/shared/select/MultiSelectDropdown';
import Tag from 'ui/shared/Tag';
import Options from '../Options';

import {
  buttonDisplayedClassname,
  ExpandCollapseIcon,
  filterOptions,
  getOptionLabel,
  getOptions,
  isOption,
  optionButtonClassname,
  sortOptionByAlphabet,
  TOption,
  TSelectBase,
  TSelectSelectionButtonBase,
} from '../commons';
import OptionMenu from './OptionMenu';

const isUserCreatedOption = (optionValue: string, options?: string[]) =>
  options?.some(o => o === optionValue);

type TSelectCreateTagsDropdown<T extends string> =
  TMultiSelectDropdownProps<T> & {
    onCreateClick: (value: string) => void;
    onDeleteClick?: (id: string) => void;
    onUpdateTagName?: (tag_id: string, tag_name: string) => void;
    /** tableau d'id des options crées par un utilisateur */
    userCreatedTagIds?: string[];
  };

/** Sélecteur de Tag(s) avec un input dans le bouton d'ouverture pour créer un tag */
const SelectCreateTagsDropdown = <T extends string>({
  values,
  options,
  onSelect,
  onCreateClick,
  onDeleteClick,
  onUpdateTagName,
  userCreatedTagIds,
  placement,
  placeholderText,
  disabled,
  'data-test': dataTest,
}: TSelectCreateTagsDropdown<T>) => {
  const [inputValue, setInputValue] = useState('');

  const onInputChange = (value: string) => {
    setInputValue(value);
  };

  const filteredOptions = filterOptions(options, inputValue);

  const isNotSimilar =
    inputValue.toLowerCase().trim() !==
    getOptions(filteredOptions)[0]?.label.toLowerCase().trim();

  return (
    <DropdownFloater
      placement={placement}
      toggle={false}
      enterToToggle={false}
      render={() => (
        <div>
          {inputValue.trim().length > 0 && isNotSimilar && (
            <button
              data-test={`${dataTest}-creer-tag`}
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
          <Options
            dataTest={dataTest}
            values={values}
            options={sortOptionByAlphabet(filterOptions(options, inputValue))}
            onSelect={onSelect}
            renderOption={option => (
              <Tag
                title={option.label}
                isUserCreated={isUserCreatedOption(
                  option.value,
                  userCreatedTagIds
                )}
              />
            )}
            renderOptionMenu={({option, close}) =>
              !disabled &&
              isUserCreatedOption(option.value, userCreatedTagIds) ? (
                <OptionMenu
                  option={option}
                  onDeleteClick={onDeleteClick}
                  onUpdateTagName={onUpdateTagName}
                  close={close}
                />
              ) : null
            }
          />
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
        userCreatedTagIds={userCreatedTagIds}
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
    /** tableau d'id des options crées par un utilisateur */
    userCreatedTagIds?: string[];
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
      userCreatedTagIds,
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

    const valuesAsOptions = options.filter(
      o => isOption(o) && values?.some(v => v === o.value)
    ) as TOption[];

    const sortedValues = valuesAsOptions
      .sort((a, b) => {
        if (a.label.toUpperCase() < b.label.toUpperCase()) {
          return -1;
        }
        if (a.label.toUpperCase() > b.label.toUpperCase()) {
          return 1;
        }
        return 0;
      })
      .map(o => o.value) as T[];

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
            {sortedValues &&
              sortedValues?.length !== 0 &&
              sortedValues.map(v => (
                <Tag
                  key={v}
                  title={getOptionLabel(v, getOptions(options))}
                  onCloseClick={() =>
                    onSelect(sortedValues.filter(value => value !== v))
                  }
                  isUserCreated={isUserCreatedOption(v, userCreatedTagIds)}
                />
              ))}
            {!disabled && (
              <input
                data-test={`${dataTest}-input`}
                type="text"
                ref={inputRef}
                className={`grow text-sm placeholder:text-gray-500 placeholder:italic`}
                value={inputValue}
                placeholder={placeholderText}
                onChange={e => onInputChange(e.target.value)}
              />
            )}
          </div>
          <ExpandCollapseIcon isOpen={isOpen} />
        </div>
      </div>
    );
  }
);
