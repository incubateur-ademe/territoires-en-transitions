import { useCurrentCollectivite } from '@/api/collectivites';
import { useIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useIndicateurDefinition';
import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { TIndicateurListItem } from '@/app/app/pages/collectivite/Indicateurs/types';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useUpdateFiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-update-fiche';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import {
  Button,
  Divider,
  EmptyCard,
  Event,
  SideMenu,
  useEventTracker,
} from '@/ui';
import { useState } from 'react';
import LoadingCard from '../LoadingCard';
import DatavizPicto from './DatavizPicto';
import ModaleCreerIndicateur from './ModaleCreerIndicateur';
import Content from './SideMenu/Content';

type IndicateursAssociesProps = {
  isReadonly: boolean;
  isFicheLoading: boolean;
  fiche: Fiche;
};

const IndicateursAssocies = ({
  isReadonly,
  isFicheLoading,
  fiche,
}: IndicateursAssociesProps) => {
  const { collectiviteId } = useCurrentCollectivite();
  const { mutate: updateFiche } = useUpdateFiche();

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tracker = useEventTracker();

  const { data: selectedIndicateurs } = useIndicateurDefinitions({
    ficheActionIds: [fiche.id],
  });

  if (isFicheLoading) return <LoadingCard />;

  const isEmpty = selectedIndicateurs?.length === 0;

  const updateIndicateurs = (indicateur: TIndicateurListItem) => {
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

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(props) => <DatavizPicto {...props} />}
          title="Aucun indicateur associé !"
          subTitle="Observez votre progression grâce aux indicateurs"
          isReadonly={isReadonly}
          actions={[
            {
              children: 'Créer un indicateur',
              icon: 'add-line',
              onClick: () => {
                tracker(Event.indicateurs.createIndicateurPerso);
                setIsModalOpen(true);
                setIsPanelOpen(false);
              },
              variant: 'outlined',
            },
            {
              children: 'Associer des indicateurs',
              icon: 'link',
              onClick: () => setIsPanelOpen((prevState) => !prevState),
              variant: 'primary',
            },
          ]}
          size="xs"
        />
      ) : (
        <div>
          <Divider />

          {/* Titre et boutons d'ajout des indicateurs */}
          <div className="flex flex-col gap-8 mb-8">
            <div className="flex flex-wrap justify-between items-end gap-3">
              <span className="uppercase text-primary-9 text-sm font-bold leading-6 mr-3">
                Indicateurs associés :
              </span>
              {!isReadonly && (
                <div className="flex justify-center items-center gap-4">
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

          {/* Liste des indicateurs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
            {selectedIndicateurs?.map((indicateur) => (
              <IndicateurCard
                key={`${indicateur.id}-${indicateur.titre}`}
                readonly={isReadonly}
                definition={indicateur}
                isEditable
                card={{ external: true }}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId,
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
        </div>
      )}

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
