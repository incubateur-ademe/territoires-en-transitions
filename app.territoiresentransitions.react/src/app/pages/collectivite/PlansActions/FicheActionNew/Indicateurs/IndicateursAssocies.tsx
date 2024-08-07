import {useState} from 'react';
import {Button, Divider} from '@tet/ui';
import {FicheAction} from '../../FicheAction/data/types';
import Content from '../../FicheAction/FicheActionForm/indicateurs/Panel/Content';
import EmptyCard from '../EmptyCard';
import DatavizPicto from './DatavizPicto';
import IndicateursListe from './IndicateursListe';
import ModaleCreerIndicateur from './ModaleCreerIndicateur';
import SideMenu from '../SideMenu';

type IndicateursAssociesProps = {
  isReadonly: boolean;
  fiche: FicheAction;
  updateFiche: (fiche: FicheAction) => void;
};

const IndicateursAssocies = ({
  isReadonly,
  fiche,
  updateFiche,
}: IndicateursAssociesProps) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {indicateurs} = fiche;

  const isEmpty = indicateurs === null || indicateurs.length === 0;

  return (
    <>
      {isEmpty ? (
        <EmptyCard
          picto={className => <DatavizPicto className={className} />}
          title="Aucun indicateur associé !"
          subTitle="Observez votre progression grâce aux indicateurs"
          isReadonly={isReadonly}
          action={{
            label: 'Associer des indicateurs',
            icon: 'link',
            onClick: () => setIsPanelOpen(prevState => !prevState),
          }}
          secondaryAction={{
            label: 'Créer un indicateur personnalisé',
            icon: 'add-line',
            onClick: () => {
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
                      setIsModalOpen(true);
                      setIsPanelOpen(false);
                    }}
                  >
                    Créer un indicateur personnalisé
                  </Button>
                  <Button
                    size="xs"
                    icon="link"
                    onClick={() => setIsPanelOpen(prevState => !prevState)}
                  >
                    Associer des indicateurs
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Liste des indicateurs */}
          <IndicateursListe
            {...{isReadonly, fiche, indicateurs, updateFiche}}
          />
        </div>
      )}

      {/* Menu de sélection des indicateurs */}
      <SideMenu
        title="Associer des indicateurs"
        isOpen={isPanelOpen}
        setIsOpen={setIsPanelOpen}
      >
        <Content
          selectedIndicateurs={indicateurs}
          onSelect={indicateurs => updateFiche({...fiche, indicateurs})}
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
