import { Tag } from '@/domain/collectivites';
import { SelectMultipleProps } from '@/ui';
import SelectTags from '../tags/SelectTags';
import { useServicesPilotesListe } from './useServicesPilotesListe';

type ServicesPilotesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    services,
    selectedService,
  }: {
    services: Tag[];
    selectedService: Tag;
  }) => void;
  disabledOptionsIds?: number[];
  onTagEdit?: (editedTag: Tag) => void;
};

const ServicesPilotesDropdown = (props: ServicesPilotesDropdownProps) => {
  const { data, refetch } = useServicesPilotesListe();

  return (
    <SelectTags
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      queryKey="services_pilotes"
      tagTableName="service_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({ values, selectedValue }) => {
        props.onChange({
          services: values,
          selectedService: selectedValue,
        });
      }}
      onTagEdit={props.onTagEdit}
    />
  );
};

export default ServicesPilotesDropdown;
