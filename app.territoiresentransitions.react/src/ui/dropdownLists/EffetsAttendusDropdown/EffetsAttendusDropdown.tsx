import {SelectFilter, SelectMultipleProps} from '@tet/ui';
import {TFicheActionResultatsAttendus} from 'types/alias';
import {ficheActionResultatsAttendusOptions} from '../listesStatiques';

type EffetsAttendusDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: TFicheActionResultatsAttendus[];
  onChange: ({
    effets,
    selectedEffet,
  }: {
    effets: TFicheActionResultatsAttendus[];
    selectedEffet: TFicheActionResultatsAttendus;
  }) => void;
};

const EffetsAttendusDropdown = (props: EffetsAttendusDropdownProps) => {
  return (
    <SelectFilter
      {...props}
      isSearcheable
      options={ficheActionResultatsAttendusOptions}
      onChange={({values, selectedValue}) =>
        props.onChange({
          effets: values as TFicheActionResultatsAttendus[],
          selectedEffet: selectedValue as TFicheActionResultatsAttendus,
        })
      }
    />
  );
};

export default EffetsAttendusDropdown;
