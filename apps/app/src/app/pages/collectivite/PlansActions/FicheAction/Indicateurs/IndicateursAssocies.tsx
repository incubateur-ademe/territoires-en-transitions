import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { IndicateursAssociesEmpty } from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/IndicateursAssociesEmpty';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { canUpdateIndicateurDefinition } from '@/app/indicateurs/indicateurs/indicateur-definition-authorization.utils';
import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import {
  Button,
  Divider,
  Event,
  SideMenu,
  useEventTracker,
  VisibleWhen,
} from '@tet/ui';
import { useState } from 'react';
import { SharedFicheLinkedResourcesAlert } from '../../../../../../plans/fiches/share-fiche/shared-fiche-linked-resources.alert';
import { Fiche } from '../data/use-get-fiche';
import ModaleCreerIndicateur from './ModaleCreerIndicateur';
import { Content } from './SideMenu/Content';

type IndicateursAssociesProps = {
  isReadonly: boolean;
  fiche: Fiche;
};

const IndicateursAssocies = ({
  isReadonly,
  fiche,
}: IndicateursAssociesProps) => {
  const { mutate: updateFiche } = useUpdateFiche();
  const { collectiviteId: currentCollectiviteId, permissions } =
    useCurrentCollectivite();
  const { id: userId } = useUser();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tracker = useEventTracker();

  const { data: { data: selectedIndicateurs } = {}, isLoading } =
    useListIndicateurs({
      collectiviteId: fiche.collectiviteId,
      filters: {
        ficheIds: [fiche.id],
      },
    });

  const updateIndicateurs = (indicateur: IndicateurDefinitionListItem) => {
    // Check si l'indicateur est déjà associé
    const isAssocie =
      selectedIndicateurs?.some((i) => i.id === indicateur.id) ?? false;

    // Ajoute ou retire l'indicateur de la liste
    const indicateurs = isAssocie
      ? selectedIndicateurs?.filter((i) => i.id !== indicateur.id) ?? []
      : [...(selectedIndicateurs ?? []), indicateur];

    updateFiche({
      ficheId: fiche.id,
      ficheFields: {
        indicateurs,
      },
    });
  };

  const canCreateIndicateur = hasPermission(
    permissions,
    'indicateurs.indicateurs.create'
  );

  return (
    <>
      <div>
        <Divider />

        {/* Titre et boutons d'ajout des indicateurs */}
        {!isFicheSharedWithCollectivite(fiche, currentCollectiviteId) && (
          <div className="flex flex-col gap-8 mb-8">
            <div className="flex flex-wrap justify-between items-end gap-3">
              <span className="uppercase text-primary-9 text-sm font-bold leading-6 mr-3">
                Indicateurs associés :
              </span>
              {!isReadonly && (
                <div className="flex justify-center items-center gap-4">
                  <VisibleWhen condition={canCreateIndicateur}>
                    <Button
                      size="xs"
                      variant="outlined"
                      icon="add-line"
                      onClick={() => {
                        tracker(Event.indicateurs.createIndicateurPerso);
                        setIsModalOpen(true);
                        setIsPanelOpen(false);
                      }}
                    >
                      Créer un indicateur
                    </Button>
                  </VisibleWhen>
                  <Button
                    size="xs"
                    icon="link"
                    onClick={() => setIsPanelOpen((prevState) => !prevState)}
                  >
                    Associer des indicateurs
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <SharedFicheLinkedResourcesAlert
          fiche={fiche}
          currentCollectiviteId={currentCollectiviteId}
          sharedDataTitle="Indicateurs associés"
          sharedDataDescription="Les indicateurs et les données affichées correspondent à ceux de cette collectivité."
        />
        {/* Liste des indicateurs */}
        {isLoading ? (
          <div className="h-[24rem] flex">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : selectedIndicateurs?.length === 0 ? (
          <IndicateursAssociesEmpty
            isReadonly={isReadonly}
            canCreateIndicateur={canCreateIndicateur}
            onCreateIndicateur={() => {
              tracker(Event.indicateurs.createIndicateurPerso);
              setIsModalOpen(true);
              setIsPanelOpen(false);
            }}
            onAssociateIndicateur={() =>
              setIsPanelOpen((prevState) => !prevState)
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
            {selectedIndicateurs?.map((indicateur) => (
              <IndicateurCard
                key={`${indicateur.id}-${indicateur.titre}`}
                readonly={isReadonly}
                definition={indicateur}
                externalCollectiviteId={fiche.collectiviteId}
                isEditable={canUpdateIndicateurDefinition(
                  permissions,
                  indicateur,
                  userId
                )}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId: fiche.collectiviteId,
                  indicateurView: getIndicateurGroup(
                    indicateur.identifiantReferentiel
                  ),
                  indicateurId: indicateur.id,
                  identifiantReferentiel: indicateur.identifiantReferentiel,
                })}
                selectState={{
                  // Dissocier
                  selected: true,
                  setSelected: (i) => updateIndicateurs(i),
                }}
                otherMenuActions={(indicateur) => [
                  <Button
                    key={indicateur.id}
                    onClick={() => updateIndicateurs(indicateur)} // Ajouter
                    icon="link-unlink"
                    title="Dissocier l'indicateur"
                    size="xs"
                    variant="grey"
                  />,
                ]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Menu de sélection des indicateurs */}
      <SideMenu
        title="Associer des indicateurs"
        isOpen={isPanelOpen}
        setIsOpen={setIsPanelOpen}
      >
        <Content
          selectedIndicateurs={selectedIndicateurs}
          onSelect={(indicateur) => updateIndicateurs(indicateur)}
        />
      </SideMenu>

      {/* Modale de création d'un nouvel indicateur */}
      <ModaleCreerIndicateur
        isOpen={isModalOpen && !isReadonly}
        setIsOpen={setIsModalOpen}
        fiche={fiche}
      />
    </>
  );
};

export default IndicateursAssocies;
