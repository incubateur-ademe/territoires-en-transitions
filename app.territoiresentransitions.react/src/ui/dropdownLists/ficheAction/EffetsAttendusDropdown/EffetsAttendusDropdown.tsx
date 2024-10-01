import {SelectFilter, SelectMultipleProps} from '@tet/ui';
import {TFicheActionResultatsAttendus} from 'types/alias';
import {useEffetsAttendus} from './useEffetsAttendus';

type EffetsAttendusDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: TFicheActionResultatsAttendus[];
  onChange: ({effets}: {effets: TFicheActionResultatsAttendus[]}) => void;
};

const EffetsAttendusDropdown = ({
  values,
  onChange,
}: EffetsAttendusDropdownProps) => {
  const {data: options} = useEffetsAttendus();
  if (!options?.length) return;

  return (
    <SelectFilter
      values={values?.map(v => v.id)}
      isSearcheable
      options={options.map(({id, nom}) => ({value: id, label: nom}))}
      onChange={({values}) =>
        onChange({
          effets: options.filter(v =>
            values?.includes(v.id)
          ) as TFicheActionResultatsAttendus[],
        })
      }
    />
  );
};

export default EffetsAttendusDropdown;
