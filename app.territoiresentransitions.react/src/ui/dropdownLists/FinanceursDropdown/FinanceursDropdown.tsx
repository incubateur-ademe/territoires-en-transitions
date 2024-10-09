import { Tag } from '@tet/api/shared/domain';
import { SelectMultipleProps } from '@tet/ui';
import SelectTags from '../tags/SelectTags';
import { useFinanceursListe } from './useFinanceursListe';

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
    financeurs: Tag[];
    selectedFinanceur: Tag;
  }) => void;
};

const FinanceursDropdown = (props: FinanceursDropdownProps) => {
  const { data, refetch } = useFinanceursListe();

  return (
    <SelectTags
      {...props}
      queryKey="financeurs"
      tagTableName="financeur_tag"
      optionsListe={data}
      disabledOptionsIds={props.disabledOptionsIds}
      userCreatedOptionsIds={(data ?? [])
        .map((d) => d.id)
        .filter((d) => !props.disabledOptionsIds?.includes(d))}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          financeurs: values,
          selectedFinanceur: selectedValue,
        });
      }}
    />
  );
};

export default FinanceursDropdown;
