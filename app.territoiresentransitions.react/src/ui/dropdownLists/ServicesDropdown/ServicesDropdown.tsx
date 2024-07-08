import {useCollectiviteId} from 'core-logic/hooks/params';
import {TFicheActionServicePiloteRow} from 'types/alias';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {useServiceListe} from './useServicePiloteListe';
import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useTagCreate} from '../hooks/useTagCreate';
import {useEffect} from 'react';

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
  const collectivite_id = useCollectiviteId();

  const {data: serviceListe} = useServiceListe();

  const options: Option[] = serviceListe
    ? serviceListe.map(service => ({
        value: service.id,
        label: service.nom,
      }))
    : [];

  const getSelectedServices = (values?: OptionValue[]) =>
    (serviceListe ?? []).filter(s => values?.some(v => v === s.id));

  const {mutate: updateTag} = useTagUpdate({
    key: ['services_pilotes', collectivite_id],
    tagTableName: 'service_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['services_pilotes', collectivite_id],
    tagTableName: 'service_tag',
  });

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['services_pilotes', collectivite_id],
    tagTableName: 'service_tag',
  });

  const newTagId = newTag?.data?.[0].id!;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag = {
        collectivite_id: collectivite_id!,
        nom: newTag.data[0].nom,
        id: newTagId,
      };

      props.onChange({
        services: [tag, ...getSelectedServices(props.values)],
        selectedService: tag,
      });
    }
  }, [newTagId]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'ServicePilote'}
      options={options}
      placeholder={props.placeholder ?? 'Sélectionnez ou créez un pilote'}
      onChange={({values, selectedValue}) =>
        props.onChange({
          services: getSelectedServices(values),
          selectedService: getSelectedServices([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions: serviceListe?.map(s => s.id) ?? [],
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: parseInt(tag_id as string),
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            services: getSelectedServices(
              props.values?.filter(v => v !== tag_id)
            ),
            selectedService: getSelectedServices(
              props.values?.filter(v => v === tag_id)
            )[0],
          });
          deleteTag(parseInt(tag_id as string));
        },
        onCreate: inputValue =>
          createTag({
            collectivite_id: collectivite_id!,
            nom: inputValue,
          }),
      }}
    />
  );
};

export default ServicesDropdown;
