import { useState } from 'react';
import { Button, Divider, useEventTracker } from '@tet/ui';
import { FicheAction } from '@tet/api/plan-actions';
import Content from './SideMenu/Content';
import EmptyCard from '../EmptyCard';
import DatavizPicto from './DatavizPicto';
import ModaleCreerIndicateur from './ModaleCreerIndicateur';
import SideMenu from '../SideMenu';
import LoadingCard from '../LoadingCard';
import { TIndicateurListItem } from 'app/pages/collectivite/Indicateurs/types';
import {
  getIndicateurGroup,
  selectIndicateur,
} from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import { makeCollectiviteIndicateursUrl } from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import {
  factoryIndicateurInsertToIndicateurListItem,
  factoryIndicateurListItemToIndicateurInsert,
} from 'app/pages/collectivite/PlansActions/FicheAction/Indicateurs/utils';

type IndicateursAssociesProps = {
  isReadonly: boolean;
  isFicheLoading: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursAssocies = ({
  isReadonly,
  isFicheLoading,
  fiche,
  updateFiche,
}: IndicateursAssociesProps) => {
  const collectiviteId = useCollectiviteId()!;

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tracker = useEventTracker('app/fiche-action');

  if (isFicheLoading) return <LoadingCard />;

  const selectedIndicateurs =
    fiche.indicateurs?.map((i) =>
      factoryIndicateurInsertToIndicateurListItem(i)
    ) ?? [];

  const isEmpty = selectedIndicateurs.length === 0;

  const updateIndicateurs = (indicateur: TIndicateurListItem) => {
    const selected =
      selectedIndicateurs?.some((i) => i.id === indicateur.id) ?? false;
    const newIndicateurs = selectIndicateur({
      indicateur,
      selected,
      selectedIndicateurs,
    });
    updateFiche({
      ...fiche,
      indicateurs: newIndicateurs.map((i) =>
        factoryIndicateurListItemToIndicateurInsert(i)
      ),
    });
  };

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={(className) => <DatavizPicto className={className} />}
          title="Aucun indicateur associé !"
          subTitle="Observez votre progression grâce aux indicateurs"
          isReadonly={isReadonly}
          action={{
            label: 'Associer des indicateurs',
            icon: 'link',
            onClick: () => setIsPanelOpen((prevState) => !prevState),
          }}
          secondaryAction={{
            label: 'Créer un indicateur',
            icon: 'add-line',
            onClick: () => {
              collectiviteId &&
                tracker('cta_indicateur_perso_fa', {
                  collectivite_id: collectiviteId,
                });
              setIsModalOpen(true);
              setIsPanelOpen(false);
            },
          }}
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
                      collectiviteId &&
                        tracker('cta_indicateur_perso_fa', {
                          collectivite_id: collectiviteId,
                        });
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
          {/* <IndicateursListe {...{isReadonly, fiche, updateIndicateurs}} /> */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
            {selectedIndicateurs.map((indicateur) => (
              <IndicateurCard
                key={`${indicateur.id}-${indicateur.titre}`}
                readonly={isReadonly}
                definition={indicateur}
                autoRefresh
                isEditable
                card={{ external: true }}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId,
                  indicateurView: getIndicateurGroup(indicateur.identifiant),
                  indicateurId: indicateur.id,
                  identifiantReferentiel: indicateur.identifiant,
                })}
                selectState={{
                  // Dissocier
                  selected: true,
                  setSelected: (i) => updateIndicateurs(i),
                }}
                otherMenuActions={(indicateur) => [
                  <Button
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
