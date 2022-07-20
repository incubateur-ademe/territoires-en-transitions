import {keys} from 'ramda';
import {forwardRef, ReactElement, Ref, useState} from 'react';
import {Placement} from '@floating-ui/react-dom-interactions';
import DropdownFloater from 'ui/shared/floating-ui/DropdownFloater';

const DropdownButtonDisplayed = forwardRef(
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
        className={`fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 ${
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
                  <span className="block fr-fi-check-line scale-75" />
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
      <DropdownButtonDisplayed labels={labels} value={value} />
    </DropdownFloater>
  );
};

export const MultiSelectDropdown = <T extends string>({
  values,
  labels,
  onSelect,
}: {
  values?: T[];
  labels: Record<T, string>;
  onSelect: (value: T[]) => void;
}) => {
  const [opened, setOpened] = useState(false);
  const [selectedValues, setSelectedValues] = useState<T[]>(values || []);
  return (
    <div className="group relative">
      <button
        aria-label="ouvrir le menu"
        onClick={() => {
          if (opened) onSelect(selectedValues);
          setOpened(!opened);
        }}
        className="flex items-center w-full p-2 -ml-2 text-left"
      >
        {selectedValues ? (
          <span className="mr-auto flex flex-col">
            {selectedValues.sort().map(value => (
              <span key={value}>{labels[value]}</span>
            ))}
          </span>
        ) : null}
        <span
          className={`fr-fi-arrow-down-s-line mt-1 ml-1 scale-90 ${
            opened ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`bg-white absolute -left-2 top-full min-w-full w-max transition-all shadow-md z-50 ${
          opened ? 'visible translate-y-1 opacity-100 ' : 'invisible opacity-0'
        }`}
      >
        {Object.keys(labels).map(v => {
          const label = labels[v as T];
          return (
            <button
              aria-label={label}
              key={v}
              className="flex items-center w-full p-2 text-left"
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
                setOpened(false);
              }}
            >
              <div className="w-6 mr-2">
                {selectedValues.includes(v as T) ? (
                  <span className="block fr-fi-check-line scale-75" />
                ) : null}
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
