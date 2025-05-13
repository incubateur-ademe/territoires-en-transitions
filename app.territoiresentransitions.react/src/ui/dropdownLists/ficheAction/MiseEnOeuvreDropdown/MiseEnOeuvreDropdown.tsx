import { TempsDeMiseEnOeuvre } from '@/domain/shared';
import { Select, SelectProps } from '@/ui';
import { useMiseEnOeuvre } from './useMiseEnOeuvre';

type MiseEnOeuvreDropdownProps = Omit<
  SelectProps,
  'values' | 'onChange' | 'options'
> & {
  values?: TempsDeMiseEnOeuvre | null;
  onChange: (tempsDeMiseEnOeuvre: TempsDeMiseEnOeuvre | null) => void;
};

const MiseEnOeuvreDropdown = (props: MiseEnOeuvreDropdownProps) => {
  const { data: options } = useMiseEnOeuvre();
  if (!options?.length) return;

  return (
    <Select
      {...props}
      values={props.values?.id}
      options={options.map(({ id, nom }) => ({
        value: id,
        label: nom,
      }))}
      onChange={(value) => {
        const selectedOption =
          value !== undefined ? options.filter((v) => value === v.id)[0] : null;
        props.onChange(selectedOption);
      }}
    />
  );
};

export default MiseEnOeuvreDropdown;
