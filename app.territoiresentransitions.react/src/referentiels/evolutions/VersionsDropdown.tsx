import { Option, SelectFilter, SelectMultipleProps } from '@/ui';

type VersionsDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    versions,
    selectedVersion,
  }: {
    versions: number[];
    selectedVersion: number;
  }) => void;
};

const VersionsDropdown = (props: VersionsDropdownProps) => {
  const options: Option[] = [
    { value: 1, label: '2010 - Nom de la version' },
    { value: 2, label: '2011 - Nom de la version' },
    { value: 3, label: '2012 - Nom de la version' },
  ];

  const getSelectedVersions = (values?: (string | number)[]) =>
    values?.map((v) => Number(v)) ?? [];

  return (
    <div>
      <label className="mb-2">Sélectionner les versions à afficher :</label>
      <SelectFilter
        {...props}
        options={options}
        dataTest="versions"
        onChange={({ values, selectedValue }) =>
          props.onChange({
            versions: getSelectedVersions(values),
            selectedVersion: getSelectedVersions([selectedValue])[0],
          })
        }
      />
    </div>
  );
};

export default VersionsDropdown;
