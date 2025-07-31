import { Field, Option, Select } from '@/ui';
type Props = {
  type?: string;
  onSelect: (type?: Option) => void;
};

export const collectiviteType = {
  Region: 'region',
  Departement: 'departement',
  EPCI: 'epci',
  Commune: 'commune',
  Test: 'test',
};

export const CollectiviteTypeField = ({ type, onSelect }: Props) => {
  const options : Option[] = [
    { label: 'Commune', value: collectiviteType.Commune },
    { label: 'EPCI', value: collectiviteType.EPCI },
    { label: 'Département', value: collectiviteType.Departement },
    { label: 'Région', value: collectiviteType.Region },
    { label: 'Collectivité test', value: collectiviteType.Test},
  ];

  return (
    <Field title="Type de collectivité" className='self-end'>
      <Select
        options={options}
        values={type ?? ''}
        onChange={(value) => onSelect(options.find((t) => t.value === value))}
      />
    </Field>
  );
};
