import classNames from 'classnames';
import Tag from 'ui/shared/Tag';
import {getOptionLabel, getOptions, TSelectBase} from './commons';
import MultiSelectDropdown from './MultiSelectDropdown';

type TMultiSelectTagsDropdown<T extends string> = TSelectBase & {
  values?: T[];
  onSelect: (values: T[]) => void;
};

const MultiSelectTagsDropdown = <T extends string>({
  values,
  options,
  buttonClassName,
  placeholderText,
  onSelect,
  disabled,
  containerWidthMatchButton,
  'data-test': dataTest,
}: TMultiSelectTagsDropdown<T>) => {
  return (
    <MultiSelectDropdown
      data-test={dataTest}
      buttonClassName={classNames(`${buttonClassName}`, {
        'cursor-default': values && values?.length > 0,
      })}
      containerWidthMatchButton={containerWidthMatchButton}
      values={values}
      options={options}
      onSelect={onSelect}
      placeholderText={placeholderText}
      disabled={disabled}
      renderSelection={values => (
        <div className="flex items-center flex-wrap gap-2">
          {values.map(v => (
            <Tag
              key={v}
              title={getOptionLabel(v, getOptions(options))}
              onCloseClick={() => onSelect(values.filter(val => val !== v))}
            />
          ))}
        </div>
      )}
      renderOption={option => <Tag title={option.label} />}
    />
  );
};

export default MultiSelectTagsDropdown;
