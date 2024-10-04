import { ResultatsAttendus } from '@tet/api/plan-actions';
import { SelectFilter, SelectMultipleProps } from '@tet/ui';
import { ficheActionResultatsAttendusOptions } from '../../listesStatiques';

type EffetsAttendusDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: ResultatsAttendus[];
  onChange: ({
    effets,
    selectedEffet,
  }: {
    effets: ResultatsAttendus[];
    selectedEffet: ResultatsAttendus;
  }) => void;
};

const EffetsAttendusDropdown = (props: EffetsAttendusDropdownProps) => {
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={ficheActionResultatsAttendusOptions}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          effets: values as ResultatsAttendus[],
          selectedEffet: selectedValue as ResultatsAttendus,
        })
      }
    />
  );
};

export default EffetsAttendusDropdown;
