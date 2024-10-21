import { useEffect } from 'react';

import {
  Option,
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
} from '@tet/ui';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { useTagCreate } from 'ui/dropdownLists/tags/useTagCreate';
import { useDeleteTag } from 'ui/dropdownLists/tags/useTagDelete';
import { useTagUpdate } from 'ui/dropdownLists/tags/useTagUpdate';

import { Personne } from '@tet/api/collectivites';
import { usePersonneListe } from './usePersonneListe';
import { getPersonneStringId } from './utils';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: ({
    personnes,
    selectedPersonne,
  }: {
    personnes: Personne[];
    selectedPersonne: Personne;
  }) => void;
  disabledOptionsIds?: string[];
};

/** Sélecteur de personnes de la collectivité */
const PersonnesDropdown = (props: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: personneListe } = usePersonneListe();

  const options: Option[] = personneListe
    ? personneListe.map((personne) => ({
        value: getPersonneStringId(personne),
        label: personne.nom!,
        disabled: props.disabledOptionsIds?.includes(
          getPersonneStringId(personne)
        ),
      }))
    : [];

  const getSelectedPersonnes = (values?: OptionValue[]) =>
    personneListe?.filter((p) =>
      values?.some((v) => v === getPersonneStringId(p))
    ) ?? [];

  const { mutate: updateTag } = useTagUpdate({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
  });

  const { mutate: deleteTag } = useDeleteTag({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
  });

  const { data: newTag, mutate: createTag } = useTagCreate({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
  });

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag: Personne = {
        collectiviteId: collectiviteId!,
        nom: newTag.data[0].nom,
        tagId: newTagId ?? null,
        userId: null,
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
      onChange={({ values, selectedValue }) =>
        props.onChange({
          personnes: getSelectedPersonnes(values),
          selectedPersonne: getSelectedPersonnes([selectedValue])[0],
        })
      }
      createProps={{
        userCreatedOptions:
          personneListe
            ?.filter((p) => p.tagId)
            .map((p) => p.tagId!.toString()) ?? [],
        onUpdate: (tagId, tagName) => {
          updateTag({
            collectiviteId: collectiviteId!,
            id: parseInt(tagId as string),
            nom: tagName,
          });
        },
        onDelete: (tagId) => {
          props.onChange({
            personnes: getSelectedPersonnes(
              props.values?.filter((v) => v !== tagId)
            ),
            selectedPersonne: getSelectedPersonnes(
              props.values?.filter((v) => v === tagId)
            )[0],
          });
          deleteTag(parseInt(tagId as string));
        },
        onCreate: (inputValue) =>
          createTag({
            collectiviteId: collectiviteId!,
            nom: inputValue,
          }),
      }}
    />
  );
};

export default PersonnesDropdown;
