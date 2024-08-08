import {SelectMultipleProps} from '@tet/ui';
import {TFicheActionServicePiloteRow} from 'types/alias';
import SelectWithUpdates from '../SelectWithUpdates/SelectWithUpdates';
import {useServicesPilotesListe} from './useServicesPilotesListe';

type ServicesPilotesDropdownProps = Omit<
  SelectMultipleProps,
  'values' | 'onChange' | 'options'
> & {
  values?: number[];
  onChange: ({
    services,
    selectedService,
  }: {
    services: TFicheActionServicePiloteRow[];
    selectedService: TFicheActionServicePiloteRow;
  }) => void;
  disabledOptionsIds?: number[];
};

const ServicesPilotesDropdown = (props: ServicesPilotesDropdownProps) => {
  const {data, refetch} = useServicesPilotesListe();

  return (
    <SelectWithUpdates
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      queryKey="services_pilotes"
      tagTableName="service_tag"
      optionsListe={data}
      refetchOptions={refetch}
      onChange={({values, selectedValue}) => {
        props.onChange({
          services: values,
          selectedService: selectedValue,
        });
      }}
    />
  );
};

export default ServicesPilotesDropdown;
