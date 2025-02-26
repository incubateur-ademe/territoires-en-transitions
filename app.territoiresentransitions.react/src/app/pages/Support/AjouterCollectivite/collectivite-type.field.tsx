import { Field, Option, Select } from '@/ui';
type Props = {
  type?: string;
  onSelect: (type?: Option) => void;
};

export const CollectiviteTypeField = ({ type, onSelect }: Props) => {
  const options : Option[] = [
    { label: 'Commune', value: 'commune' },
    { label: 'EPCI', value: 'epci' },
    { label: 'Département', value: 'departement' },
    { label: 'Région', value: 'region' },
    { label: 'Collectivité test', value: 'test'},
  ];

  return (
    <Field title="Type de collectivité" hint="Choisir le type de collectivité">
      <Select
        options={options}
        values={type ?? ''}
        onChange={(value) => onSelect(options.find((t) => t.value === value))}
      />
    </Field>
  );
};
