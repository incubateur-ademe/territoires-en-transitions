import { TagWithCollectiviteId } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useFinanceursListe } from './useFinanceursListe';

type FinanceursDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  /**
   * Si spécifié, on récupère les financeurs de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
  values: number[] | undefined;
  disabledOptionsIds?: number[];
  onChange: ({
    financeurs,
    selectedFinanceur,
  }: {
    financeurs: TagWithCollectiviteId[];
    selectedFinanceur: TagWithCollectiviteId;
  }) => void;
};

const FinanceursDropdown = (props: FinanceursDropdownProps) => {
  const { data, refetch } = useFinanceursListe(props.collectiviteIds);

  return (
    <SelectTags
      {...props}
      queryKey={['financeurs']}
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
