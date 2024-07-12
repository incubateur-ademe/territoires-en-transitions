import {SelectMultipleProps} from '@tet/ui';
import {TPartenaireRow} from 'types/alias';
import SelectWithUpdates from '../SelectWithUpdates/SelectWithUpdates';
import {usePartenairesListe} from './usePartenairesListe';

type PartenairesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    partenaires,
    selectedPartenaire,
  }: {
    partenaires: TPartenaireRow[];
    selectedPartenaire: TPartenaireRow;
  }) => void;
};

const PartenairesDropdown = (props: PartenairesDropdownProps) => {
  const {data, refetch} = usePartenairesListe();

  return (
    <SelectWithUpdates
      {...props}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un partenaire'}
      queryKey="partenaires"
      tagTableName="partenaire_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({values, selectedValue}) => {
        props.onChange({
          partenaires: values,
          selectedPartenaire: selectedValue,
        });
      }}
    />
  );
};

export default PartenairesDropdown;
