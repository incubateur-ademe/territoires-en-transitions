import {useEffect} from 'react';

import {SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useTagCreate} from 'ui/dropdownLists/hooks/useTagCreate';
import {useCollectiviteId} from 'core-logic/hooks/params';

import {useServicesPilotesListe} from 'ui/dropdownLists/ServicesPilotesDropdown/useServicesPilotesListe';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: number[];
  onChange: ({
    services,
    selectedService,
  }: {
    services?: number[];
    selectedService: number;
  }) => void;
  disabledOptionsIds?: number[];
};

/** Sélecteur de services pilotes de la collectivité */
const ServicesPilotesDropdown = (props: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: serviceListe} = useServicesPilotesListe();

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

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTagId) {
      props.onChange({
        services: props.values ? [newTagId, ...props.values] : [newTagId],
        selectedService: newTagId,
      });
    }
  }, [newTagId]);

  const options = serviceListe
    ? serviceListe.map(service => ({
        value: service.id,
        label: service.nom,
      }))
    : [];

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'services_pilotes'}
      options={options}
      onChange={({values, selectedValue}) =>
        props.onChange({
          services: values as number[],
          selectedService: selectedValue as number,
        })
      }
      createProps={{
        userCreatedOptions: options.map(o => o.value),
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: tag_id as number,
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            services: props.values?.filter(v => v !== tag_id),
            selectedService: tag_id as number,
          });
          deleteTag(tag_id as number);
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

export default ServicesPilotesDropdown;
