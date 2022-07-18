import {keys} from 'ramda';
import {ReactElement, useState} from 'react';

export const SelectDropdown = <T extends string>({
  value,
  labels,
  onSelect,
  displayOption,
  options,
}: {
  value?: T;
  labels: Record<T, string>;
  displayOption?: (option: T) => ReactElement;
  onSelect: (value: T) => void;
  options?: T[];
}) => {
  const [opened, setOpened] = useState(false);
  // const [selectedValue, setSelectedValue] = useState<T | undefined>(value);
  const selectableOptions: T[] = options ?? keys(labels);
  return (
    <div className="group relative">
      <button
        onClick={() => setOpened(!opened)}
        className="flex items-center w-full p-2 -ml-2 text-left"
      >
        {value ? <span className="mr-auto">{labels[value]}</span> : null}
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
        {selectableOptions.map(v => (
          <button
            key={v}
            className="flex items-center w-full p-2 text-left"
            onClick={() => {
              onSelect(v as T);
              // setSelectedValue(v as T);
              setOpened(false);
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
        ))}
      </div>
    </div>
  );
};

export const MultiSelectDropdown = <T extends string>({
  values,
  labels,
  onSelect,
}: {
  values?: T[];
  labels: Record<T, string | ReactElement>;
  onSelect: (value: T[]) => void;
}) => {
  const [opened, setOpened] = useState(false);
  const [selectedValues, setSelectedValues] = useState<T[]>(values || []);
  return (
    <div className="group relative">
      <button
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
        {Object.keys(labels).map(v => (
          <button
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
            }}
          >
            <div className="w-6 mr-2">
              {selectedValues.includes(v as T) ? (
                <span className="block fr-fi-check-line scale-75" />
              ) : null}
            </div>
            <span>{labels[v as T]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
