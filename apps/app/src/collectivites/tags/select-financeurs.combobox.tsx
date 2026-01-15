import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import { SelectTagsCombobox } from './select-tags.combobox';
import { useListFinanceurs } from './use-list-financeurs';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
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

const SelectFinanceursCombobox = (props: Props) => {
  const { data, refetch } = useListFinanceurs({
    collectiviteIds: props.collectiviteIds,
  });

  return (
    <SelectTagsCombobox
      {...props}
      tagType={TagEnum.Financeur}
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

export default SelectFinanceursCombobox;
