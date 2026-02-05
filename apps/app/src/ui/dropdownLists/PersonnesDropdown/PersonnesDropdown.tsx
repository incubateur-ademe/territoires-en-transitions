import { SHARE_ICON } from '@/app/plans/fiches/share-fiche/fiche-share-info';
import { useTagCreate } from '@/app/ui/dropdownLists/tags/useTagCreate';
import { useDeleteTag } from '@/app/ui/dropdownLists/tags/useTagDelete';
import { useTagUpdate } from '@/app/ui/dropdownLists/tags/useTagUpdate';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { RouterOutput, useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import {
  Option,
  OptionValue,
  SelectFilter,
  SelectMultipleProps,
} from '@tet/ui';
import { useEffect } from 'react';
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
const PersonnesDropdown = ({
  collectiviteIds,
  disabledOptionsIds,
  disableEdition = false,
  additionalKeysToInvalidate,
  onChange,
  values,
  dataTest,
  ...props
}: Props) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isEditionEnabled =
    !disableEdition && hasCollectivitePermission('collectivites.tags.mutate');

  const {
    data: personneListe,
    isLoading,
    refetch,
  } = usePersonneListe(collectiviteIds);

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
        disabled: disabledOptionsIds?.includes(getPersonneStringId(personne)),
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
    keysToInvalidate: additionalKeysToInvalidate,
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

      queryClient.invalidateQueries({
        queryKey: trpc.collectivites.tags.personnes.list.queryKey({
          collectiviteId,
        }),
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

      onChange({
        personnes: [tag, ...getSelectedPersonnes(values)],
        selectedPersonne: tag,
      });
    }
  }, [newTagId]);

  return (
    <SelectFilter
      {...props}
      dataTest={dataTest ?? 'personnes'}
      values={values}
      isSearcheable
      isLoading={isLoading}
      options={options}
      onChange={({ values, selectedValue }) =>
        onChange({
          personnes: getSelectedPersonnes(values),
          selectedPersonne: getSelectedPersonnes([selectedValue])[0],
        })
      }
      createProps={
        isEditionEnabled
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
                onChange({
                  personnes: getSelectedPersonnes(
                    values?.filter((v) => v !== tagId)
                  ),
                  selectedPersonne: getSelectedPersonnes(
                    values?.filter((v) => v === tagId)
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
                  'En confirmant la suppression, cela supprimera également l’association de ce tag aux actions, indicateurs et mesures des référentiels.',
              },
            }
          : undefined
      }
    />
  );
};

export default PersonnesDropdown;
