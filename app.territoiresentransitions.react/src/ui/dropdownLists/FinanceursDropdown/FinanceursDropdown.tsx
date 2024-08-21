import {SelectMultipleProps} from '@tet/ui';
import {TFinanceurTagInsert} from 'types/alias';
import {useFinanceursListe} from './useFinanceursListe';
import SelectWithUpdates from '../tags/SelectTags';

type FinanceursDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values: number[] | undefined;
  disabledOptionsIds?: number[];
  onChange: ({
    financeurs,
    selectedFinanceur,
  }: {
    financeurs: TFinanceurTagInsert[];
    selectedFinanceur: TFinanceurTagInsert;
  }) => void;
};

const FinanceursDropdown = (props: FinanceursDropdownProps) => {
  const {data, refetch} = useFinanceursListe();

  return (
    <SelectWithUpdates
      {...props}
      queryKey="financeurs"
      tagTableName="financeur_tag"
      optionsListe={data}
      disabledOptionsIds={props.disabledOptionsIds}
      userCreatedOptionsIds={(data ?? [])
        .map(d => d.id)
        .filter(d => !props.disabledOptionsIds?.includes(d))}
      refetchOptions={refetch}
      onChange={({values, selectedValue}) => {
        props.onChange({
          financeurs: values,
          selectedFinanceur: selectedValue,
        });
      }}
    />
  );
};

export default FinanceursDropdown;
