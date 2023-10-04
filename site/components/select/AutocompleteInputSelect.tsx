// Composant copié depuis l'app

import {forwardRef, Ref, useEffect, useRef, useState} from 'react';
import classNames from 'classnames';
import {useDebouncedCallback} from 'use-debounce';

import DropdownFloater from '../floating-ui/DropdownFloater';
import {TMultiSelectDropdownProps} from './MultiSelectDropdown';
import Tag from '@components/tag/Tag';

import {
  buttonDisplayedClassname,
  DSFRbuttonClassname,
  ExpandCollapseIcon,
  filterOptions,
  getOptionLabel,
  getOptions,
  TSelectBase,
  TSelectSelectionButtonBase,
} from './commons';
import Options from './Options';

type TAutocompleteInputSelectProps<T extends string> =
  TMultiSelectDropdownProps<T> & {
    noOptionPlaceholder?: string;
    isLoading?: boolean;
    debounce?: boolean;
    externalOptionsFiltering?: boolean;
  };

/** Sélecteur avec un input dans le bouton d'ouverture pour faire une recherche dans la liste d'options */
const AutocompleteInputSelect = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  onInputChange,
  buttonClassName,
  dsfrButton,
  placement,
  placeholderText,
  noOptionPlaceholder,
  isLoading = false,
  containerWidthMatchButton,
  disabled,
  debounce = false,
  externalOptionsFiltering = false,
  'data-test': dataTest,
}: TAutocompleteInputSelectProps<T>) => {
  /**
   * Permet de profiter du debounce de l'input et d'afficher un text de chargement
   * quand l'utilisateur est entrain de faire une saisie.
   */
  const [loading, setLoading] = useState(isLoading);
  useEffect(() => setLoading(isLoading), [isLoading]);

  /**
   * Stockage de la valeur de l'input dans un state interne afin d'appliquer un debounce
   * à la fonction donner par le composant parent pouvant être une query.
   */
  const [inputValue, setInputValue] = useState('');

  // Fonction de debounce
  const handleDebouncedInputChange = useDebouncedCallback(() => {
    if (onInputChange) {
      onInputChange(inputValue);
    }
    setLoading(false);
  }, 500);

  // Application du debounce à chaque changement de valeur de l'input
  useEffect(() => {
    if (debounce) handleDebouncedInputChange();
    else if (onInputChange) onInputChange(inputValue);
  }, [inputValue]);

  return (
    <DropdownFloater
      containerWidthMatchButton={containerWidthMatchButton}
      placement={placement}
      toggle={false}
      enterToToggle={false}
      render={({listRef, activeIndex}) => (
        <Options
          dataTest={dataTest}
          listRef={listRef}
          activeIndex={activeIndex}
          values={values}
          options={
            externalOptionsFiltering
              ? options
              : filterOptions(options, inputValue)
          }
          onSelect={values => {
            onSelect(values);
            setInputValue('');
          }}
          renderOption={renderOption}
          noOptionPlaceholder={noOptionPlaceholder}
          isLoading={loading}
        />
      )}
    >
      <AutocompleteButton
        data-test={dataTest}
        buttonClassName={classNames(
          dsfrButton && DSFRbuttonClassname,
          buttonClassName,
        )}
        options={options}
        values={values}
        inputValue={inputValue}
        onInputChange={value => {
          if (debounce) setLoading(true);
          setInputValue(value);
        }}
        onSelect={onSelect as (values: string[]) => void}
        onChangeFocus={() => setLoading(false)}
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
    onSelect: (values: T[]) => void;
    onChangeFocus: () => void;
  };

/**
 * Bouton qui ouvre le dropdown menu
 * Création d'un composant séparé pour passer la ref du bouton au floater
 */
// eslint-disable-next-line react/display-name
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
      onChangeFocus,
      disabled,
      ...props
    }: TAutocompleteButtonProps<T>,
    ref?: Ref<HTMLDivElement>,
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
              className="grow placeholder:text-grey425 outline-0"
              value={inputValue}
              placeholder={placeholderText}
              onChange={e => onInputChange(e.target.value)}
              onFocus={() => onChangeFocus()}
              onClick={() => onChangeFocus()}
              disabled={disabled}
            />
          </div>
          <ExpandCollapseIcon isOpen={isOpen} />
        </div>
      </div>
    );
  },
);
