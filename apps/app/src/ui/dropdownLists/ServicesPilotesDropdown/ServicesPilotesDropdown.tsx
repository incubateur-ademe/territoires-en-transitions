import { TagWithCollectiviteId } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import { QueryKey } from '@tanstack/react-query';
import SelectTags from '../tags/SelectTags';
import { useServicesPilotesListe } from './useServicesPilotesListe';

type ServicesPilotesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  disableOptionsForOtherCollectivites?: boolean;

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
  additionalKeysToInvalidate?: QueryKey[];
  disableEdition?: boolean;
};

const ServicesPilotesDropdown = (props: ServicesPilotesDropdownProps) => {
  const { data, refetch } = useServicesPilotesListe(props.collectiviteIds);

  return (
    <SelectTags
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      queryKey={['services_pilotes']}
      tagTableName="service_tag"
      additionalKeysToInvalidate={props.additionalKeysToInvalidate}
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

export default ServicesPilotesDropdown;
