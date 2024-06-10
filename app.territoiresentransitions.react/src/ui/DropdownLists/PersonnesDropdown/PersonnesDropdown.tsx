import {useEffect} from 'react';

import {Option, OptionValue, SelectFilter, SelectMultipleProps} from '@tet/ui';
import {usePersonneListe} from 'app/pages/collectivite/PlansActions/FicheAction/data/options/usePersonneListe';
import {useDeleteTag} from 'ui/DropdownLists/hooks/useTagDelete';
import {useTagUpdate} from 'ui/DropdownLists/hooks/useTagUpdate';
import {useTagCreate} from 'ui/DropdownLists/hooks/useTagCreate';
import {Personne} from 'app/pages/collectivite/PlansActions/FicheAction/data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';

import {getPersonneStringId} from './utils';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: (personnes: Personne[]) => void;
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

  /** Utilise useEffect pour de récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      props.onChange([
        {
          collectivite_id: collectivite_id!,
          nom: newTag.data[0].nom,
          tag_id: newTag.data[0].id,
          user_id: null,
        },
        ...getSelectedPersonnes(props.values),
      ]);
    }
  }, [newTag?.data]);

  return (
    <SelectFilter
      {...props}
      dataTest={props.dataTest ?? 'personnes'}
      options={options}
      onChange={({values}) => props.onChange(getSelectedPersonnes(values))}
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
          props.onChange(
            getSelectedPersonnes(props.values?.filter(v => v !== tag_id))
          );
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
