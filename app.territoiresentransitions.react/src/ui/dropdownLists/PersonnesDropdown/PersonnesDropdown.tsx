import { useCollectiviteId } from '@/api/collectivites';
import { RouterOutput, trpc } from '@/api/utils/trpc/client';
import { SHARE_ICON } from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { useTagCreate } from '@/app/ui/dropdownLists/tags/useTagCreate';
import { useDeleteTag } from '@/app/ui/dropdownLists/tags/useTagDelete';
import { useTagUpdate } from '@/app/ui/dropdownLists/tags/useTagUpdate';
import { PersonneTagOrUser } from '@/domain/collectivites';
import { Option, OptionValue, SelectFilter, SelectMultipleProps } from '@/ui';
import { useEffect } from 'react';
import { QueryKey } from 'react-query';
import { usePersonneListe } from './usePersonneListe';
import { getPersonneStringId } from './utils';

type Tag = RouterOutput['collectivites']['personnes']['list'][number];

type Props = Omit<SelectMultipleProps, 'values' | 'onChange' | 'options'> & {
  values?: string[];
  /**
   * Si spécifié, on récupère les tags de toutes ces collectivités et pas uniquement de la collectivité courante
   */
  collectiviteIds?: number[];
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
  const trpcUtils = trpc.useUtils();

  const {
    data: personneListe,
    isLoading,
    refetch,
  } = usePersonneListe(props.collectiviteIds);

  const getOptionIcon = (personne: Tag) => {
    if (personne.tagId && personne.collectiviteId !== collectiviteId) {
      return { icon: SHARE_ICON, iconClassname: 'text-success-1' };
    }
    if (personne.userId) {
      return { icon: 'user-follow-line', iconClassname: 'text-success-1' };
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

      trpcUtils.collectivites.tags.personnes.list.invalidate({
        collectiviteId,
      });
    },
  });

  const newTagId = newTag?.data?.[0].id;

  /** Utilise useEffect pour récupérer le nouvel id
   * du tag créé afin d'appliquer le onChange */
  useEffect(() => {
    if (newTag?.data) {
      const tag: PersonneTagOrUser = {
        collectiviteId,
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
      isLoading={isLoading}
      options={options}
      onChange={({ values, selectedValue }) =>
        props.onChange({
          personnes: getSelectedPersonnes(values),
          selectedPersonne: getSelectedPersonnes([selectedValue])[0],
        })
      }
      createProps={
        !props.disableEdition
          ? {
              userCreatedOptions:
                (personneListe as Tag[])
                  ?.filter(
                    (p) => p.tagId && p.collectiviteId === collectiviteId
                  )
                  .map((p) => p.tagId.toString()) ?? [],
              onUpdate: (tagId, tagName) => {
                updateTag({
                  collectiviteId,
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
                  collectiviteId,
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
            }
          : undefined
      }
    />
  );
};

export default PersonnesDropdown;
