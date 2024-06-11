import {useCollectiviteId} from 'core-logic/hooks/params';
import {TOption} from 'ui/shared/select/commons';
import SelectCreateTagsDropdown from 'ui/shared/select/SelectCreateTagsDropdown';
import {useServicePiloteListe} from '../data/options/useServicePiloteListe';
import {TFicheActionServicePiloteInsert} from 'types/alias';
import {formatNewTag} from '../data/utils';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';

type Props = {
  services: TFicheActionServicePiloteInsert[] | null;
  onSelect: (service: TFicheActionServicePiloteInsert[]) => void;
  isReadonly: boolean;
};

const ServicePiloteDropdown = ({services, onSelect, isReadonly}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: serviceListe} = useServicePiloteListe();

  const {mutate: updateTag} = useTagUpdate({
    key: ['services_pilotes', collectivite_id],
    tagTableName: 'service_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['services_pilotes', collectivite_id],
    tagTableName: 'service_tag',
  });

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
      data-test="ServicePilote"
      values={services?.map((service: TFicheActionServicePiloteInsert) =>
        service.id ? service.id.toString() : ''
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
      onUpdateTagName={(tag_id, tag_name) =>
        updateTag({
          collectivite_id: collectivite_id!,
          id: parseInt(tag_id),
          nom: tag_name,
        })
      }
      onDeleteClick={tag_id => deleteTag(parseInt(tag_id))}
      userCreatedTagIds={serviceListe?.map(s => s.id.toString())}
      disabled={isReadonly}
    />
  );
};

export default ServicePiloteDropdown;
