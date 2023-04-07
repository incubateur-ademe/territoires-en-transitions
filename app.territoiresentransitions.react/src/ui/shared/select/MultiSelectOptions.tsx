import {Checkmark, optionButtonClassname, TOption} from './commons';

type Props<T extends string> = {
  values?: T[];
  options: TOption[];
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
  dataTest?: string;
};

const MultiSelectOptions = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  dataTest,
}: Props<T>) => {
  return (
    <div data-test={`${dataTest}-options`}>
      {options.map(option => (
        <button
          key={option.value}
          data-test={option.value}
          className={optionButtonClassname}
          onClick={() => {
            if (values?.includes(option.value as T)) {
              onSelect(
                values.filter(
                  selectedValue => selectedValue !== (option.value as T)
                )
              );
            } else {
              onSelect([...(values || []), option.value as T]);
            }
          }}
        >
          <Checkmark
            isSelected={values?.includes(option.value as T) || false}
          />
          {/* {renderOption(option)} */}
          {renderOption ? (
            renderOption(option)
          ) : (
            <span className="leading-6">{option.label}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default MultiSelectOptions;
