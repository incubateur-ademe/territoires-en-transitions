import {useEffect} from 'react';

import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {useDeleteTag} from 'ui/dropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/dropdownLists/hooks/useTagUpdate';
import {useTagCreate} from 'ui/dropdownLists/hooks/useTagCreate';
import {useCollectiviteId} from 'core-logic/hooks/params';

import {getPersonneStringId} from './utils';
import {Personne, usePersonneListe} from './usePersonneListe';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: ({
    personnes,
    selectedPersonne,
  }: {
    personnes: Personne[];
    selectedPersonne: Personne;
  }) => void;
};

/** Sélecteur de personnes de la collectivité */
const PersonnesDropdown = (props: Props) => {
  const collectivite_id = useCollectiviteId();

  const {data: personneListe} = usePersonneListe();

  const options: Option[] = personneListe
    ? personneListe.map(personne => ({
        value: getPersonneStringId(personne),
        label: personne.nom!,
      }))
    : [];

  const getSelectedPersonnes = (values?: OptionValue[]) =>
    personneListe?.filter(p =>
      values?.some(v => v === getPersonneStringId(p))
    ) ?? [];

  const {mutate: updateTag} = useTagUpdate({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
  });

  const {mutate: deleteTag} = useDeleteTag({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
  });

  const {data: newTag, mutate: createTag} = useTagCreate({
    key: ['personnes', collectivite_id],
    tagTableName: 'personne_tag',
  });

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag = {
        collectivite_id: collectivite_id!,
        nom: newTag.data[0].nom,
        tag_id: newTagId,
        user_id: null,
      };

      props.onChange({
        personnes: [tag, ...getSelectedPersonnes(props.values)],
        selectedPersonne: tag,
      });
    }
  }, [newTagId]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'personnes'}
      options={options}
      onChange={({values, selectedValue}) =>
        props.onChange({
          personnes: getSelectedPersonnes(values),
          selectedPersonne: getSelectedPersonnes([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions:
          personneListe?.filter(p => p.tag_id).map(p => p.tag_id!.toString()) ??
          [],
        onUpdate: (tag_id, tag_name) => {
          updateTag({
            collectivite_id: collectivite_id!,
            id: parseInt(tag_id as string),
            nom: tag_name,
          });
        },
        onDelete: tag_id => {
          props.onChange({
            personnes: getSelectedPersonnes(
              props.values?.filter(v => v !== tag_id)
            ),
            selectedPersonne: getSelectedPersonnes(
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

export default PersonnesDropdown;
