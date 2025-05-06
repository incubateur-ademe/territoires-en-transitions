import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useTagCreate } from '@/app/ui/dropdownLists/tags/useTagCreate';
import { useDeleteTag } from '@/app/ui/dropdownLists/tags/useTagDelete';
import { useTagUpdate } from '@/app/ui/dropdownLists/tags/useTagUpdate';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect } from 'react';
import { QueryKey } from 'react-query';
import { usePersonneListe } from './usePersonneListe';
import { getPersonneStringId } from './utils';

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  onChange: ({
    personnes,
    selectedPersonne,
  }: {
    personnes: PersonneTagOrUser[];
    selectedPersonne: PersonneTagOrUser;
  }) => void;
  disabledOptionsIds?: string[];
  disableEdition?: boolean;
  additionalKeysToInvalidate?: QueryKey[];
};

/** Sélecteur de personnes de la collectivité */
const PersonnesDropdown = (props: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: personneListe, refetch } = usePersonneListe();

  const options: Option[] = personneListe
    ? personneListe.map((personne) => ({
        value: getPersonneStringId(personne),
        label: personne.nom,
        disabled: props.disabledOptionsIds?.includes(
          getPersonneStringId(personne)
        ),
        icon: personne.userId ? 'user-follow-line' : undefined,
        iconClassname: personne.userId ? 'text-success-1' : undefined,
      }))
    : [];

  const getSelectedPersonnes = (values?: OptionValue[]) =>
    personneListe?.filter((p) =>
      values?.some((v) => v === getPersonneStringId(p))
    ) ?? [];

  const { mutate: updateTag } = useTagUpdate({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
    keysToInvalidate: props.additionalKeysToInvalidate,
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: deleteTag } = useDeleteTag({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
    onSuccess: () => {
      refetch();
    },
  });

  const { data: newTag, mutate: createTag } = useTagCreate({
    key: ['personnes', collectiviteId],
    tagTableName: 'personne_tag',
    onSuccess: () => {
      refetch();
    },
  });

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag: PersonneTagOrUser = {
        collectiviteId: collectiviteId,
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
      isSearcheable
      options={options}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          personnes: getSelectedPersonnes(values),
          selectedPersonne: getSelectedPersonnes([selectedValue])[0],
        })
      }
      // actions={[
      //   {
      //     label: 'Associer ce compte à un tag',
      //     icon: 'user-add-line',
      //     action: () => alert('test !'),
      //   },
      // ]}
      createProps={
        !props.disableEdition
          ? {
              userCreatedOptions:
                personneListe
                  ?.filter((p) => p.tagId)
                  .map((p) => p.tagId.toString()) ?? [],
              onUpdate: (tagId, tagName) => {
                updateTag({
                  collectiviteId: collectiviteId,
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
                  collectiviteId: collectiviteId,
                  nom: inputValue,
                }),
              // actions: [
              //   {
              //     label: 'Inviter à créer un compte',
              //     icon: 'mail-send-line',
              //     action: () => alert('test !'),
              //   },
              //   {
              //     label: 'Associer ce tag à un compte',
              //     icon: 'user-add-line',
              //     action: () => alert('test !'),
              //   },
              // ],
            }
          : undefined
      }
    />
  );
};

export default PersonnesDropdown;
