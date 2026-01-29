import { TProfondeurAxe } from '@/app/plans/plans/types';
import { PlanNode } from '@tet/domain/plans';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
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
  // Si l'axe est invalide, on le filtre
  if (invalidAxeIds.includes(plan.axe.id)) {
    return null;
  }

  // Filtrer les enfants récursivement
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

  // IDs des axes invalides (l'axe actuel et tous ses descendants)
  const invalidAxeIds = [axe.id, ...getChildrenAxeIds(axe, axes)];

  // Construire la structure TProfondeurAxe à partir des axes fournis
  const currentPlan = rootAxe ? planNodeToProfondeurAxe(rootAxe, axes) : null;

  // Filtrer les axes invalides dans le plan actuel
  const filteredPlan = currentPlan
    ? filterInvalidAxes(currentPlan, invalidAxeIds)
    : null;

  // On peut déplacer si le plan filtré existe (même s'il n'a pas d'enfants, on peut déplacer à la racine)
  const canMove = filteredPlan !== null;

  // gestion de la sélection d'un emplacement
  const {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe,
    openParentAxesAndScrollToElement,
  } = useSelectAxes();

  // Sauvegarde du déplacement de l'axe
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
      dataTest="move-axe-modal"
      size="xl"
      title="Déplacer cet axe"
      openState={openState}
      render={({ descriptionId }) => (
        <div id={descriptionId} className="flex flex-col gap-8">
          {/* Message d'info */}
          <Alert title="Sélectionnez l'emplacement de cet axe" />

          {/* Arborescence des axes disponibles */}
          {canMove && filteredPlan ? (
            <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
              <ColonneTableauEmplacement
                axesList={[filteredPlan]}
                selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
                maxSelectedDepth={selectedAxes.length - 1}
                onSelectAxe={handleSelectAxe}
              />

              {selectedAxes.map((axe) => {
                return axe.enfants ? (
                  <ColonneTableauEmplacement
                    key={axe.axe.id}
                    axesList={axe.enfants}
                    selectedAxesIds={selectedAxes.map((axe) => axe.axe.id)}
                    maxSelectedDepth={selectedAxes.length - 1}
                    onSelectAxe={handleSelectAxe}
                  />
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-primary-9 text-sm font-bold">
              {"Il n'existe aucun emplacement disponible pour déplacer cet axe"}
            </span>
          )}
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: handleSave,
            disabled: !selectedAxes.length || !canMove,
          }}
        />
      )}
    />
  );
};
