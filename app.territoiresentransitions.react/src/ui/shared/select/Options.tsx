import {
  Checkmark,
  isOptionSection,
  optionButtonClassname,
  TOption,
  TSelectOption,
} from './commons';

type Props<T extends string> = {
  values?: T[];
  options: TSelectOption[];
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
  dataTest?: string;
};

const Options = <T extends string>({
  values,
  options,
  onSelect,
  renderOption,
  dataTest,
}: Props<T>) => {
  return (
    <div data-test={`${dataTest}-options`}>
      {options.map((option, i) => {
        if (isOptionSection(option)) {
          return (
            <div key={option.title + i}>
              <div className="w-full p-1 pl-10 text-left text-sm italic text-gray-500 bg-gray-100 border-y border-gray-200">
                {option.title}
              </div>
              {option.options.map((option, i) => (
                <Option
                  key={`${option.value}`}
                  option={option}
                  values={values}
                  onSelect={onSelect}
                  renderOption={renderOption}
                />
              ))}
            </div>
          );
        } else {
          return (
            <Option
              key={option.value}
              option={option}
              values={values}
              onSelect={onSelect}
              renderOption={renderOption}
            />
          );
        }
      })}
    </div>
  );
};

export default Options;

type OptionProps<T extends string> = {
  values?: T[];
  option: TOption;
  onSelect: (values: T[]) => void;
  renderOption?: (option: TOption) => React.ReactElement;
};

const Option = <T extends string>({
  values,
  option,
  onSelect,
  renderOption,
}: OptionProps<T>) => (
  <button
    data-test={option.value}
    className={optionButtonClassname}
    onClick={() => {
      if (values?.includes(option.value as T)) {
        // retrait d'une valeur
        onSelect(
          values.filter(selectedValue => selectedValue !== (option.value as T))
        );
      } else {
        // ajoût d'une valeur
        onSelect([...(values || []), option.value as T]);
      }
    }}
  >
    <Checkmark isSelected={values?.includes(option.value as T) || false} />
    {renderOption ? (
      renderOption(option)
    ) : (
      <span className="leading-6">{option.label}</span>
    )}
  </button>
);
