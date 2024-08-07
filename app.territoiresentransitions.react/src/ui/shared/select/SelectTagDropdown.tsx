import {Tag} from '@tet/ui';
import {getOptionLabel, getOptions, TSelectBase} from './commons';
import SelectDropdown from './SelectDropdown';

type TSelectTagDropdown<T extends string> = TSelectBase & {
  value?: T;
  onSelect: (value: T | null) => void;
};

const SelectTagDropdown = <T extends string>({
  value,
  options,
  buttonClassName,
  placeholderText,
  containerWidthMatchButton,
  onSelect,
  disabled,
  'data-test': dataTest,
}: TSelectTagDropdown<T>) => {
  return (
    <SelectDropdown
      data-test={dataTest}
      buttonClassName={buttonClassName}
      containerWidthMatchButton={containerWidthMatchButton}
      value={value}
      options={options}
      onSelect={onSelect}
      placeholderText={placeholderText}
      disabled={disabled}
      renderSelection={v => (
        <Tag
          title={getOptionLabel(v, getOptions(options))}
          onClose={() => onSelect(null)}
        />
      )}
      renderOption={option => (
        <Tag title={getOptionLabel(option.value, getOptions(options))} />
      )}
    />
  );
};

export default SelectTagDropdown;
