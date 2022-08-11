import {keys} from 'ramda';
import {
  forwardRef,
  ReactElement,
  Ref,
  useEffect,
  useRef,
  useState,
} from 'react';
import {Placement} from '@floating-ui/react-dom-interactions';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';

/* Class génériques */
const buttonDisplayedClassname =
  'flex items-center w-full p-2 -ml-2 text-left text-sm';
const buttonDisplayedPlaceholderClassname = 'mr-auto text-gray-500 italic';
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
      placeholderText,
      ...props
    }: {
      labels: Record<T, string>;
      value?: T;
      isOpen?: boolean;
      placeholderText?: string;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-label="ouvrir le menu"
      className={buttonDisplayedClassname}
      {...props}
    >
      {value ? (
        <span className="mr-auto">{labels[value]}</span>
      ) : (
        <span className={buttonDisplayedPlaceholderClassname}>
          {placeholderText ?? ''}
        </span>
      )}
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
  placeholderText,
}: {
  placement?: Placement;
  value?: T;
  labels: Record<T, string>;
  displayOption?: (option: T) => ReactElement;
  onSelect: (value: T) => void;
  options?: T[];
  placeholderText?: string;
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
      <SelectDropdownButtonDisplayed
        placeholderText={placeholderText}
        labels={labels}
        value={value}
      />
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
      placeholderText,
      ...props
    }: {
      selectedValues?: T[];
      labels: Record<T, string>;
      isOpen?: boolean;
      placeholderText?: string;
    },
    ref?: Ref<HTMLButtonElement>
  ) => (
    <button
      ref={ref}
      aria-label="ouvrir le menu"
      className={buttonDisplayedClassname}
      {...props}
    >
      {selectedValues && selectedValues?.length !== 0 ? (
        <span className="mr-auto flex flex-col">
          {selectedValues.sort().map(value => (
            <span key={value}>{labels[value]}</span>
          ))}
        </span>
      ) : (
        <span className={buttonDisplayedPlaceholderClassname}>
          {placeholderText ?? ''}
        </span>
      )}
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
  placeholderText,
}: {
  values?: T[];
  labels: Record<T, string>;
  onSelect: (value: T[]) => void;
  placeholderText?: string;
}) => {
  const [selectedValues, setSelectedValues] = useState<T[]>(values || []);

  // On execute onSelect() uniquement après un changement et non au premier render du composant
  const isFirstRender = useRef(true);
  // On execute onSelect() dans un useEffect pour avoir la bonne valeur car useState étant asynchrone,
  // si l'on performe onSelect sur le onClick du bouton on se retrouve avec la version précédente des selectedValues
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSelect(selectedValues);
  }, [selectedValues]);

  return (
    <DropdownFloater
      render={() =>
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
        placeholderText={placeholderText}
      />
    </DropdownFloater>
  );
};
