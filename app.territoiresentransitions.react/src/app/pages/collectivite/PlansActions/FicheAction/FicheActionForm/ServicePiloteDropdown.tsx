import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {useServicePiloteListe} from '../data/options/useServicePiloteListe';
import {TFicheActionServicePiloteInsert} from 'types/alias';
import {formatNewTag} from '../data/utils';

type Props = {
  services: TFicheActionServicePiloteInsert[] | null;
  onSelect: (service: TFicheActionServicePiloteInsert[]) => void;
  isReadonly: boolean;
};

const ServicePiloteDropdown = ({services, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: serviceListe} = useServicePiloteListe();

  const options: TOption[] = serviceListe
    ? serviceListe.map(service => ({
        value: service.id.toString(),
        label: service.nom,
      }))
    : [];

  const formatServicePilote = (values: string[]) =>
    serviceListe?.filter(service =>
      values.some(v => v === service.id.toString())
    ) ?? [];

  // On invalide la liste des options dans useEditFicheAction

  return (
    <SelectCreateTagsDropdown
      values={services?.map((service: TFicheActionServicePiloteInsert) =>
        service.id!.toString()
      )}
      options={options}
      onSelect={values => onSelect(formatServicePilote(values))}
      onCreateClick={inputValue =>
        onSelect(
          services
            ? [...services, formatNewTag(inputValue, collectivite_id!)]
            : [formatNewTag(inputValue, collectivite_id!)]
        )
      }
      placeholderText="Créer un tag..."
      disabled={isReadonly}
    />
  );
};

export default ServicePiloteDropdown;
