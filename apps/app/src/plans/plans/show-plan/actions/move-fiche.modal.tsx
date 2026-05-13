import { appLabels } from '@/app/labels/catalog';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { ColonneTableauEmplacement } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/NouvelEmplacement/ColonneTableauEmplacement';
import { useMoveFiche } from './use-move-fiche';

type FicheEmplacement = Pick<FicheWithRelations, 'id' | 'axes'>;

type MoveFicheModalProps = {
  fiche: FicheEmplacement;
  planId: number;
  isReadonly?: boolean;
  openState: OpenState;
};

/**
 * Modale pour déplacer une fiche dans le plan courant
 * - Sans onglet : affiche directement les colonnes présélectionnées pour l'emplacement actuel
 * - Permet seulement de déplacer la fiche dans un axe/sous-axe du plan courant ou bien à la racine de celui-ci
 * - N'affiche pas les autres plans même si la fiche est aussi rattachée à ceux-ci
 * - Quand on valide le nouvel emplacement, la fiche est bien déplacée (pas de rattachement à 2 emplacements du même plan)
 */
const MoveFicheModal = ({
  fiche,
  planId,
  isReadonly,
  openState,
}: MoveFicheModalProps) => {
  const {
    currentPlan,
    selectedAxes,
    handleSelectAxe,
    handleSave,
    handleClose,
  } = useMoveFiche({ fiche, planId, openState });

  if (!currentPlan) {
    return null;
  }

  return (
    <Modal
      openState={{
        isOpen: openState.isOpen,
        setIsOpen: (open) => (open ? openState.setIsOpen(true) : handleClose()),
      }}
      size="xl"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.deplacerAction}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div
          data-testid="move-fiche.modal"
          className="flex flex-col gap-8"
        >
          {/* Arborescence du plan courant */}
          <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
            <ColonneTableauEmplacement
              axesList={[currentPlan.plan]}
              selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
              maxSelectedDepth={selectedAxes.length - 1}
              onSelectAxe={handleSelectAxe}
            />

            {selectedAxes.map((axe) =>
              axe.enfants ? (
                <ColonneTableauEmplacement
                  key={axe.axe.id}
                  axesList={axe.enfants}
                  selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
                  maxSelectedDepth={selectedAxes.length - 1}
                  onSelectAxe={handleSelectAxe}
                />
              ) : null
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Button
          onClick={handleSave}
          disabled={!selectedAxes.length || isReadonly}
          aria-label={appLabels.valider}
        >
          {appLabels.valider}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MoveFicheModal;
