import { EffetAttendu } from '@/domain/shared';
import { SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffetsAttendus } from './useEffetsAttendus';

type EffetsAttendusDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: EffetAttendu[];
  onChange: ({ effets }: { effets: EffetAttendu[] }) => void;
};

const EffetsAttendusDropdown = ({
  values,
  onChange,
}: EffetsAttendusDropdownProps) => {
  const { data: options } = useEffetsAttendus();
  if (!options?.length) return;

  return (
    <SelectFilter
      values={values?.map((v) => v.id)}
      isSearcheable
      options={options.map(({ id, nom }) => ({ value: id, label: nom }))}
      onChange={({ values }) =>
        onChange({
          effets: options.filter((v) =>
            values?.includes(v.id)
          ) as EffetAttendu[],
        })
      }
    />
  );
};

export default EffetsAttendusDropdown;
