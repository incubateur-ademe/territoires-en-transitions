import {SelectMultipleProps} from '@tet/ui';
import {TFicheActionServicePiloteRow} from 'types/alias';
import SelectWithUpdates from '../SelectWithUpdates/SelectWithUpdates';
import {useServicesListe} from './useServicesListe';

type ServicesDropdownProps = Omit<
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
};

const ServicesDropdown = (props: ServicesDropdownProps) => {
  const {data, refetch} = useServicesListe();

  return (
    <SelectWithUpdates
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un pilote'}
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

export default ServicesDropdown;
