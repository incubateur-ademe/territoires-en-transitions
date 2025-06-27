import { trpc } from '@/api/utils/trpc/client';
import { FicheWithRelations } from '@/domain/plans/fiches';
import {
  Checkbox,
  Field,
  FormSection,
  Modal,
  ModalFooterOKCancel,
  Select,
} from '@/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useEffect, useState } from 'react';

type ModaleAccesProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche: Pick<
    FicheWithRelations,
    'titre' | 'sharedWithCollectivites' | 'restreint'
  >;
  onUpdateAccess: (
    params: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>
  ) => void;
};

type SharedWithCollectivitesType =
  FicheWithRelations['sharedWithCollectivites'];

const ModaleAcces = ({
  isOpen,
  setIsOpen,
  fiche,
  onUpdateAccess,
}: ModaleAccesProps) => {
  const { titre, sharedWithCollectivites, restreint } = fiche;

  const trpcUtils = trpc.useUtils();
  const isRestreint = restreint ?? false;
  const [isLoading, setIsLoading] = useState(false);
  const [editedRestreint, setEditedRestreint] = useState(isRestreint);
  const [editedSharedCollectivites, setEditedSharedCollectivites] = useState(
    sharedWithCollectivites
  );

  const shareFicheFlagEnabled = useFeatureFlagEnabled('is-share-fiche-enabled');

  const [collectiviteOptions, setCollectiviteOptions] = useState<
    { value: number; label: string }[]
  >([]);

  const onFilterCollectivites = async (
    search: string,
    sharedCollectivites: SharedWithCollectivitesType
  ) => {
    // charge les collectivites
    if (isLoading) return;
    setIsLoading(true);

    const matchingCollectivites =
      await trpcUtils.collectivites.collectivites.list.ensureData({
        text: search,
        limit: 20,
      });

    const newCollectiviteOptions = matchingCollectivites.map((c) => ({
      value: c.id,
      label: c.nom ?? '',
    }));

    // Ajoute les collectivités partagées qui ne sont pas dans les options
    sharedCollectivites?.forEach((collectivite) => {
      if (
        !newCollectiviteOptions.some(
          (option) => option.value === collectivite.id
        )
      ) {
        newCollectiviteOptions.push({
          value: collectivite.id,
          label: collectivite.nom ?? '',
        });
      }
    });

    setIsLoading(false);

    setCollectiviteOptions(newCollectiviteOptions);
  };

  useEffect(() => {
    if (isOpen) {
      setEditedRestreint(isRestreint);
      setEditedSharedCollectivites(sharedWithCollectivites);
      onFilterCollectivites('', sharedWithCollectivites);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (
      isRestreint !== editedRestreint ||
      JSON.stringify(sharedWithCollectivites) !==
        JSON.stringify(editedSharedCollectivites)
    ) {
      onUpdateAccess({
        restreint: editedRestreint,
        sharedWithCollectivites: editedSharedCollectivites,
      });
    }
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Gestion des accès au niveau de la fiche action"
      subTitle={titre || ''}
      size="lg"
      render={() => (
        <>
          <FormSection title="Accès général" className="!grid-cols-1 mb-4">
            <Checkbox
              data-test="FicheToggleConfidentialite"
              variant="switch"
              label="Fiche action en mode privé"
              message="Si le mode privé est activé, la fiche action n'est plus consultable par les personnes n'étant pas membres de votre collectivité. La fiche reste consultable par l'ADEME, le service support de la plateforme et les autres collectivités avec qui vous avez partagé la fiche en édition."
              containerClassname="col-span-2"
              checked={editedRestreint}
              onChange={() => setEditedRestreint((prevState) => !prevState)}
            />
          </FormSection>

          {shareFicheFlagEnabled ||
            (true && (
              <FormSection
                title="Collectivités avec accès"
                smallRootGap
                className="!grid-cols-1"
              >
                <Field
                  title="Collectivités pouvant éditer cette fiche :"
                  state="info"
                  message="Les administrateurs et éditeurs de cette collectivité pourront éditer cette fiche"
                >
                  <Select
                    dataTest="select-collectivite"
                    placeholder="Renseignez le nom de la collectivité"
                    debounce={500}
                    multiple
                    maxBadgesToShow={3}
                    options={collectiviteOptions}
                    values={
                      editedSharedCollectivites?.length
                        ? editedSharedCollectivites?.map(
                            (collectivite) => collectivite.id
                          )
                        : undefined
                    }
                    isSearcheable
                    onSearch={(search) =>
                      onFilterCollectivites(search, editedSharedCollectivites)
                    }
                    isLoading={isLoading}
                    onChange={(value) => {
                      if (value) {
                        const newSharedCollectivites = [
                          ...(editedSharedCollectivites || []),
                        ];
                        const foundIndex = newSharedCollectivites.findIndex(
                          (c) => c.id === value
                        );
                        if (foundIndex === -1) {
                          newSharedCollectivites.push({
                            id: value as number,
                            nom:
                              collectiviteOptions.find(
                                (option) => option.value === value
                              )?.label || '',
                          });
                        } else {
                          newSharedCollectivites.splice(foundIndex, 1);
                        }

                        setEditedSharedCollectivites(newSharedCollectivites);
                      }
                    }}
                  />
                </Field>
              </FormSection>
            ))}
        </>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default ModaleAcces;
