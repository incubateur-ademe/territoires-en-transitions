import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput } from '@/api/utils/trpc/client';
import InvitationModal from '@/app/app/pages/collectivite/Users/invitation/invitation-modal';
import { useTagsList } from '@/app/app/pages/collectivite/Users/tags-liste/use-tags-list';
import { useTagCreate } from '@/app/ui/dropdownLists/tags/useTagCreate';
import { useDeleteTag } from '@/app/ui/dropdownLists/tags/useTagDelete';
import { useTagUpdate } from '@/app/ui/dropdownLists/tags/useTagUpdate';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect, useState } from 'react';
import { QueryKey } from 'react-query';
import { usePersonneListe } from './usePersonneListe';
import { getPersonneStringId } from './utils';

type Tag = RouterOutput['collectivites']['personnes']['list'][number];

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
  const [tagForInvite, setTagForInvite] = useState<number | undefined>();
  // const [tagToLink, setTagToLink] = useState<number | undefined>();

  const collectiviteId = useCollectiviteId();

  const { data: personneListe, isLoading, refetch } = usePersonneListe();
  const { data: tags, refetch: refetchTags } = useTagsList(collectiviteId);

  const getTagInfo = (id: number) => {
    return (tags ?? []).find((t) => t.tagId === id);
  };

  const getOptionIcon = (personne: Tag) => {
    if (personne.userId) {
      return { icon: 'user-follow-line', iconClassname: 'text-success-1' };
    }
    if (getTagInfo(personne.tagId)?.email) {
      return { icon: 'hourglass-line', iconClassname: 'text-warning-1' };
    }
    return { icon: undefined, iconClassname: undefined };
  };

  const options: Option[] = personneListe
    ? (personneListe as Tag[]).map((personne) => ({
        value: getPersonneStringId(personne),
        label: personne.nom,
        disabled: props.disabledOptionsIds?.includes(
          getPersonneStringId(personne)
        ),
        icon: getOptionIcon(personne).icon,
        iconClassname: getOptionIcon(personne).iconClassname,
      }))
    : [];

  const getSelectedPersonnes = (values?: OptionValue[]) =>
    (personneListe as Tag[])?.filter((p) =>
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
      refetchTags();
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
    <>
      <SelectFilter
        {...props}
        dataTest={props.dataTest ?? 'personnes'}
        isSearcheable
        isLoading={isLoading}
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
                  (personneListe as Tag[])
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
                updateModal: {
                  title: 'Editer le tag pilote',
                  fieldTitle: 'Nom du tag',
                },
                deleteModal: {
                  title: 'Supprimer un tag pilote',
                  message:
                    'En confirmant la suppression, cela supprimera également l’association de ce tag aux fiches action, indicateurs et mesures des référentiels.',
                },
                actions: [
                  {
                    label: 'Inviter à créer un compte',
                    icon: 'mail-send-line',
                    action: (id) => setTagForInvite(parseInt(id as string)),
                    disabledIds: (tags ?? [])
                      .filter((t) => t?.email)
                      .map((t) => t.tagId.toString() as OptionValue),
                  },
                  // {
                  //   label: 'Associer ce tag à un compte',
                  //   icon: 'user-add-line',
                  //   action: (id) => setTagToLink(parseInt(id as string)),
                  //   disabledIds: (tags ?? [])
                  //     .filter((t) => t?.email)
                  //     .map((t) => t.tagId.toString() as OptionValue),
                  // },
                ],
              }
            : undefined
        }
      />

      <InvitationModal
        openState={{
          isOpen: !!tagForInvite,
          setIsOpen: () => tagForInvite && setTagForInvite(undefined),
        }}
        tagIds={tagForInvite ? [tagForInvite] : undefined}
      />

      {/* {!!tagToLink && (
        <LinkTagToAccountModal
          openState={{
            isOpen: !!tagToLink,
            setIsOpen: () => tagToLink && setTagToLink(undefined),
          }}
          tag={getTagInfo(tagToLink)}
        />
      )} */}
    </>
  );
};

export default PersonnesDropdown;
