import {keys} from 'ramda';
import {forwardRef, ReactElement, Ref, useState} from 'react';
import {Placement} from '@floating-ui/react-dom-interactions';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';

/* Class génériques */
const buttonDisplayedClassname = 'flex items-center w-full p-2 -ml-2 text-left';
const buttonDisplayedIconClassname =
  'fr-fi-arrow-down-s-line mt-1 ml-1 scale-90';
const optionButtonClassname = 'flex items-center w-full p-2 text-left text-sm';
const optionCheckMarkClassname = 'block fr-fi-check-line scale-75';

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const SelectDropdownButtonDisplayed = forwardRef(
  <T extends string>(
    {
      labels,
      value,
      isOpen,
      ...props
    }: {
      labels: Record<T, string>;
      value?: T;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-label="ouvrir le menu"
      className="flex items-center w-full p-2 -ml-2 text-left"
      {...props}
    >
      {value ? <span className="mr-auto">{labels[value]}</span> : null}
      <span
        className={`${buttonDisplayedIconClassname} ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
);

export const SelectDropdown = <T extends string>({
  placement,
  value,
  labels,
  onSelect,
  displayOption,
  options,
}: {
  placement?: Placement;
  value?: T;
  labels: Record<T, string>;
  displayOption?: (option: T) => ReactElement;
  onSelect: (value: T) => void;
  options?: T[];
}) => {
  const selectableOptions: T[] = options ?? keys(labels);
  return (
    <DropdownFloater
      placement={placement}
      render={({close}) =>
        selectableOptions.map(v => {
          const label = labels[v as T];
          return (
            <button
              key={v}
              aria-label={label}
              className="flex items-center w-full p-2 text-left text-sm"
              onClick={() => {
                onSelect(v as T);
                close();
              }}
            >
              <div className="w-6 mr-2">
                {value === v ? (
                  <span className={optionCheckMarkClassname} />
                ) : null}
              </div>
              <span>
                {displayOption ? displayOption(v as T) : labels[v as T]}
              </span>
            </button>
          );
        })
      }
    >
      <SelectDropdownButtonDisplayed labels={labels} value={value} />
    </DropdownFloater>
  );
};

/* Création d'un composant séparé pour passer la ref du boutton au floater */
const MultiSelectDropdownButtonDisplayed = forwardRef(
  <T extends string>(
    {
      selectedValues,
      labels,
      isOpen,
      ...props
    }: {
      selectedValues?: T[];
      labels: Record<T, string>;
      isOpen?: boolean;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-label="ouvrir le menu"
      className={buttonDisplayedClassname}
      {...props}
    >
      {selectedValues ? (
        <span className="mr-auto flex flex-col">
          {selectedValues.sort().map(value => (
            <span key={value}>{labels[value]}</span>
          ))}
        </span>
      ) : null}
      <span
        className={`${buttonDisplayedIconClassname} ${
          isOpen ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
);

export const MultiSelectDropdown = <T extends string>({
  values,
  labels,
  onSelect,
}: {
  values?: T[];
  labels: Record<T, string>;
  onSelect: (value: T[]) => void;
}) => {
  const [selectedValues, setSelectedValues] = useState<T[]>(values || []);
  return (
    <DropdownFloater
      render={({close}) =>
        Object.keys(labels).map(v => {
          const label = labels[v as T];
          return (
            <button
              key={v}
              aria-label={label}
              className={optionButtonClassname}
              onClick={() => {
                if (selectedValues.includes(v as T)) {
                  setSelectedValues(
                    selectedValues.filter(
                      selectedValue => selectedValue !== (v as T)
                    )
                  );
                } else {
                  setSelectedValues([...selectedValues, v as T]);
                }
                onSelect(selectedValues);
                close();
              }}
            >
              <div className="w-6 mr-2">
                {selectedValues.includes(v as T) ? (
                  <span className={optionCheckMarkClassname} />
                ) : null}
              </div>
              <span>{labels[v as T]}</span>
            </button>
          );
        })
      }
    >
      <MultiSelectDropdownButtonDisplayed
        labels={labels}
        selectedValues={selectedValues}
      />
    </DropdownFloater>
  );
};
