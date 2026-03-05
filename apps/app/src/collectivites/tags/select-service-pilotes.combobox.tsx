import { TagEnum, TagWithCollectiviteId } from '@tet/domain/collectivites';
import { SelectMultipleProps } from '@tet/ui';
import { SelectTagsCombobox } from './select-tags.combobox';
import { useServicesPilotesListe } from './use-list-service-pilotes';

type SelectServicesPilotesComboboxProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];

  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
  onChange: ({
    services,
    selectedService,
  }: {
    services: TagWithCollectiviteId[];
    selectedService: TagWithCollectiviteId;
  }) => void;
  disabledOptionsIds?: number[];
  disableEdition?: boolean;
};

const SelectServicesPilotesCombobox = (
  props: SelectServicesPilotesComboboxProps
) => {
  const { data, refetch } = useServicesPilotesListe(props.collectiviteIds);

  return (
    <SelectTagsCombobox
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      tagType={TagEnum.Service}
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          services: values,
          selectedService: selectedValue,
        });
      }}
    />
  );
};

export default SelectServicesPilotesCombobox;
