import { OPEN_AXES_KEY_SEARCH_PARAMETER } from '@/app/app/paths';
import { TProfondeurAxe } from '@/app/plans/plans/types';
import { TAxeRow } from '@/app/types/alias';
import { PlanNode } from '@tet/domain/plans';
import { Alert, Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { parseAsArrayOf, parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';
import { ColonneTableauEmplacement } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/NouvelEmplacement/ColonneTableauEmplacement';
import { childrenOfPlanNodes } from '../../utils';
import { useUpdateAxe } from '../data/use-update-axe';
import { getChildrenAxeIds } from '../plan-arborescence.view/get-children-axe-ids';

type Props = {
  collectiviteId: number;
  axe: PlanNode;
  rootAxe: PlanNode;
  axes: PlanNode[];
  openState: OpenState;
};

/**
 * Convertit un PlanNode en TProfondeurAxe récursivement
 */
const planNodeToProfondeurAxe = (
  node: PlanNode,
  allAxes: PlanNode[]
): TProfondeurAxe => {
  const children = childrenOfPlanNodes(node, allAxes);

  // Créer un objet TAxeRow minimal avec seulement les propriétés nécessaires
  const axeRow: TAxeRow = {
    id: node.id,
    nom: node.nom,
  } as TAxeRow;

  return {
    axe: axeRow,
    profondeur: node.depth,
    enfants: children.map((child) => planNodeToProfondeurAxe(child, allAxes)),
  };
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
  const { mutateAsync: updateAxe } = useUpdateAxe({ axe, collectiviteId });

  // Gestion de l'état d'ouverture des axes dans l'arborescence principale
  const [openAxes, setOpenAxes] = useQueryState(
    OPEN_AXES_KEY_SEARCH_PARAMETER,
    parseAsArrayOf(parseAsInteger).withDefault([])
  );

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

  // L'axe sélectionné et ceux dont il est l'enfant
  const [selectedAxes, setSelectedAxes] = useState<TProfondeurAxe[]>([]);

  // Gestion de la sélection d'un nouvel axe
  const handleSelectAxe = (selectedAxe: TProfondeurAxe) => {
    const selectedDepth = selectedAxe.profondeur;
    const currentDepth = selectedAxes.length - 1;
    const isAlreadySelected = selectedAxes.some(
      (axe) => axe.axe.id === selectedAxe.axe.id
    );

    const newSelectedAxes = [
      ...selectedAxes.filter((axe) => axe.profondeur < selectedDepth),
    ];

    if (
      !isAlreadySelected ||
      (isAlreadySelected && selectedDepth < currentDepth)
    ) {
      newSelectedAxes.push(selectedAxe);
    }

    setSelectedAxes(newSelectedAxes);
  };

  // Sauvegarde du déplacement de l'axe
  const handleSave = async () => {
    if (selectedAxes.length === 0) return;

    const { axe: targetAxe } = selectedAxes[selectedAxes.length - 1];

    // ouvre les parents de l'axe déplacé pour que le scroll fonctionne
    const axesToOpen = [
      ...new Set([...openAxes, ...selectedAxes.map((a) => a.axe.id)]),
    ];
    setOpenAxes(axesToOpen);

    setSelectedAxes([]);
    openState.setIsOpen(false);

    // scroll vers le nouvel emplacement de l'axe
    setTimeout(() => {
      const element = document.getElementById(axe.id.toString());
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', inline: 'end' });
      }
    }, 100);

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
          <Alert title="Sélectionnez le nouvel emplacement pour cet axe" />

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
