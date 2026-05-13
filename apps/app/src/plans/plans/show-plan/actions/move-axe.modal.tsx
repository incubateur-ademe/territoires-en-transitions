import { TProfondeurAxe } from '@/app/plans/plans/types';
import { appLabels } from '@/app/labels/catalog';
import { PlanNode } from '@tet/domain/plans';
import { Alert } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { OpenState } from '@tet/ui/utils/types';
import { ColonneTableauEmplacement } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/NouvelEmplacement/ColonneTableauEmplacement';
import { useSelectAxes } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/use-select-axes';
import { useUpdateAxe } from '../data/use-update-axe';
import { getChildrenAxeIds } from '../plan-arborescence.view/get-children-axe-ids';
import { planNodeToProfondeurAxe } from './plan-node-to-profondeur-axe.adapter';

type Props = {
  collectiviteId: number;
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  openState: OpenState;
};

/**
 * Filtre récursivement les axes invalides (l'axe actuel et ses descendants)
 */
const filterInvalidAxes = (
  plan: TProfondeurAxe,
  invalidAxeIds: number[]
): TProfondeurAxe | null => {
  if (invalidAxeIds.includes(plan.axe.id)) {
    return null;
  }

  const filteredEnfants =
    plan.enfants
      ?.map((enfant: TProfondeurAxe) =>
        filterInvalidAxes(enfant, invalidAxeIds)
      )
      .filter((enfant): enfant is TProfondeurAxe => enfant !== null) || [];

  return {
    ...plan,
    enfants: filteredEnfants,
  };
};

export const MoveAxeModal = ({
  collectiviteId,
  axe,
  rootAxe,
  axes,
  openState,
}: Props) => {
  const { mutateAsync: updateAxe } = useUpdateAxe({
    axe,
    collectiviteId,
    planId: rootAxe.id,
  });

  const invalidAxeIds = [axe.id, ...getChildrenAxeIds(axe, axes)];

  const currentPlan = rootAxe ? planNodeToProfondeurAxe(rootAxe, axes) : null;

  const filteredPlan = currentPlan
    ? filterInvalidAxes(currentPlan, invalidAxeIds)
    : null;

  const canMove = filteredPlan !== null;

  const {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe,
    openParentAxesAndScrollToElement,
  } = useSelectAxes();

  const handleSave = async () => {
    if (selectedAxes.length === 0) return;

    const { axe: targetAxe } = selectedAxes[selectedAxes.length - 1];

    openParentAxesAndScrollToElement(`axe-${axe.id}`);

    setSelectedAxes([]);
    openState.setIsOpen(false);

    await updateAxe({
      parent: targetAxe.id,
    });
  };

  return (
    <Modal
      openState={{ isOpen: openState.isOpen, setIsOpen: openState.setIsOpen }}
      size="xl"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.deplacerAxe}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert title={appLabels.selectionnerEmplacementAxe} />
        {canMove && filteredPlan ? (
          <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
            <ColonneTableauEmplacement
              axesList={[filteredPlan]}
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
        ) : (
          <span className="text-primary-9 text-sm font-bold">
            {appLabels.aucunEmplacementDisponibleAxe}
          </span>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={handleSave}
          disabled={!selectedAxes.length || !canMove}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};
