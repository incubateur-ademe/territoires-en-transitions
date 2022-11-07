import {forwardRef, ReactElement, Ref} from 'react';
import {Placement} from '@floating-ui/react-dom-interactions';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';
import classNames from 'classnames';

/* Class génériques */
const buttonDisplayedClassname =
  'flex items-center w-full p-2 -ml-2 text-left text-sm';
const buttonDisplayedPlaceholderClassname = 'mr-auto text-gray-500 italic';
const optionButtonClassname = 'flex items-center w-full p-2 text-left text-sm';

type TSelectDropdownProps<T extends string> = {
  placement?: Placement;
  value?: T;
  labels: Record<T, string>;
  renderOption?: (option: T) => ReactElement;
  onSelect: (value: T) => void;
  options?: T[];
  placeholderText?: string;
  'data-test'?: string;
};

export const SelectDropdown = <T extends string>({
  placement,
  value,
  labels,
  onSelect,
  renderOption,
  options,
  placeholderText,
  'data-test': dataTest,
}: TSelectDropdownProps<T>) => {
  const selectableOptions: T[] = options ?? (Object.keys(labels) as T[]);
  return (
    <SelectDropdownCustom
      data-test={dataTest}
      placement={placement}
      onSelect={onSelect}
      renderOption={v =>
        renderOption ? renderOption(v as T) : <span>{labels[v as T]}</span>
      }
      renderSelection={v => <span className="mr-auto">{labels[v as T]}</span>}
      options={selectableOptions}
      placeholderText={placeholderText}
      value={value}
    />
  );
};

/** Affiche une marque de sélection (ou seulement son emplacement) devant un
 * item de la liste */
const Checkmark = ({isSelected}: {isSelected: boolean}) => (
  <div className="w-6 mr-2">
    {isSelected ? <span className="block fr-fi-check-line scale-75" /> : null}
  </div>
);

/** Affiche l'icône plier/déplier */
const ExpandCollapseIcon = ({isOpen}: {isOpen: boolean | undefined}) => (
  <span
    className={classNames('fr-fi-arrow-down-s-line mt-1 ml-1 scale-90', {
      'rotate-180': isOpen,
    })}
  />
);

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const MultiSelectDropdownButtonDisplayed = forwardRef(
  <T extends string>(
    {
      buttonClassName,
      selectedValues,
      options,
      isOpen,
      placeholderText,
      renderSelection,
      ...props
    }: {
      buttonClassName?: string;
      selectedValues?: T[];
      options: Array<{value: string; label: string}>;
      isOpen?: boolean;
      placeholderText?: string;
      renderSelection?: (selectedValues: T[]) => ReactElement;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-expanded={isOpen}
      aria-label="ouvrir le menu"
      className={buttonClassName || buttonDisplayedClassname}
      {...props}
    >
      {selectedValues && selectedValues?.length !== 0 ? (
        renderSelection ? (
          renderSelection(selectedValues)
        ) : (
          <span className="mr-auto flex flex-col">
            {selectedValues.sort().map(value => (
              <span key={value}>
                {options.find(({value: v}) => v === value)?.label || ''}
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

export const MultiSelectDropdown = <T extends string>({
  buttonClassName,
  values,
  options,
  onSelect,
  placeholderText,
  renderValue,
  renderSelection,
}: {
  buttonClassName?: string;
  values?: T[];
  options: Array<{value: string; label: string}>;
  onSelect: (selectedValues: T[]) => void;
  placeholderText?: string;
  renderValue?: (value: T) => ReactElement;
  renderSelection?: (selectedValues: T[]) => ReactElement;
}) => {
  return (
    <DropdownFloater
      render={() =>
        options.map(({label, value: v}) => {
          return (
            <button
              key={v}
              aria-label={label}
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
              {renderValue ? renderValue(v as T) : <span>{label}</span>}
            </button>
          );
        })
      }
    >
      <MultiSelectDropdownButtonDisplayed
        buttonClassName={buttonClassName}
        options={options}
        selectedValues={values}
        placeholderText={placeholderText}
        renderSelection={
          renderSelection ? values => renderSelection(values as T[]) : undefined
        }
      />
    </DropdownFloater>
  );
};

type TSelectDropdownCustomProps<T extends string> = {
  placement?: Placement;
  value?: T;
  renderOption: (option: T) => ReactElement;
  renderSelection?: (option: T) => ReactElement;
  onSelect: (value: T) => void;
  options: T[];
  placeholderText?: string;
  'data-test'?: string;
};

/** une variante qui affiche les items avec un renderer externe, y compris la
 * valeur courante (quand la liste déroulante est fermée) */
export const SelectDropdownCustom = <T extends string>({
  placement,
  value,
  onSelect,
  renderOption,
  renderSelection,
  options,
  placeholderText,
  'data-test': dataTest,
}: TSelectDropdownCustomProps<T>) => {
  const selectableOptions: T[] = options;
  return (
    <DropdownFloater
      placement={placement}
      render={({close}) => (
        <div data-test={`${dataTest}-options`}>
          {selectableOptions.map(v => {
            return (
              <button
                key={v}
                data-test={v}
                className={optionButtonClassname}
                onClick={e => {
                  e.preventDefault();
                  onSelect(v as T);
                  close();
                }}
              >
                <Checkmark isSelected={value === v} />
                {renderOption(v as T)}
              </button>
            );
          })}
        </div>
      )}
    >
      <SelectDropdownCustomOpenButton
        data-test={dataTest}
        placeholderText={placeholderText}
        renderOption={v => (renderSelection || renderOption)(v as T)}
        value={value}
      />
    </DropdownFloater>
  );
};

/** le bouton d'ouverture pour la variante "custom" */
const SelectDropdownCustomOpenButton = forwardRef(
  <T extends string>(
    {
      value,
      isOpen,
      placeholderText,
      renderOption,
      ...props
    }: {
      value?: T;
      isOpen?: boolean;
      placeholderText?: string;
      renderOption: (option: T) => ReactElement;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-expanded={isOpen}
      aria-label="ouvrir le menu"
      className={buttonDisplayedClassname}
      {...props}
    >
      {value ? (
        <>{renderOption(value)}</>
      ) : (
        <span className={buttonDisplayedPlaceholderClassname}>
          {placeholderText ?? ''}
        </span>
      )}
      <ExpandCollapseIcon isOpen={isOpen} />
    </button>
  )
);
