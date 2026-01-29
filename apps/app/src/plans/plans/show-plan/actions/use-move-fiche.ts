import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { PlanListItem } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { TProfondeurAxe } from '@/app/plans/plans/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { OpenState } from '@tet/ui/utils/types';
import { useEffect, useRef } from 'react';
import { useSelectAxes } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/use-select-axes';
import { useGetPlan } from '../data/use-get-plan';
import { planNodeToProfondeurAxe } from './utils';

type FicheEmplacement = Pick<FicheWithRelations, 'id' | 'axes'>;

type UseMoveFicheProps = {
  fiche: FicheEmplacement;
  planId: number;
  openState: OpenState;
};

/**
 * Trouve le plan courant et l'axe actuel de la fiche dans ce plan
 */
const findCurrentPlanAndAxe = (
  plans: PlanListItem[],
  planId: number,
  fiche: Pick<FicheWithRelations, 'axes'>,
  collectiviteId: number
): {
  currentPlan: { plan: TProfondeurAxe } | null;
  currentAxeInPlan: NonNullable<FicheWithRelations['axes']>[number] | undefined;
} => {
  // trouve le plan courant
  const plan = plans.find((p) => p.id === planId);
  if (!plan || !plan.axes) {
    return { currentPlan: null, currentAxeInPlan: undefined };
  }

  // trouve l'axe racine (celui qui n'a pas de parent)
  const rootAxe = plan.axes.find((axe) => axe.parent === null);
  if (!rootAxe) {
    return { currentPlan: null, currentAxeInPlan: undefined };
  }

  // adapte le typage pour le rendre compatible avec les composants existants
  const planProfondeur = planNodeToProfondeurAxe(rootAxe, plan.axes);
  const currentPlan = { plan: planProfondeur };

  // trouve l'axe actuel de la fiche dans le plan courant
  const currentAxeInPlan = fiche.axes?.find(
    (axe) => axe.collectiviteId === collectiviteId && axe.planId === planId
  );

  return { currentPlan, currentAxeInPlan };
};

/**
 * Trouve le chemin complet d'un axe dans un plan
 * Retourne un tableau d'axes du plan racine jusqu'à l'axe cible
 */
const findAxePathInPlan = (
  plan: TProfondeurAxe,
  targetAxeId: number
): TProfondeurAxe[] | null => {
  // vérifie si l'axe cible est le plan racine
  if (plan.axe.id === targetAxeId) {
    return [plan];
  }

  // recherche récursive dans les enfants
  for (const enfant of plan.enfants || []) {
    const path = findAxePathInPlan(enfant, targetAxeId);
    if (path) {
      return [plan, ...path];
    }
  }

  return null;
};

/**
 * Hook pour gérer le déplacement d'une fiche dans un plan
 */
export const useMoveFiche = ({
  fiche,
  planId,
  openState,
}: UseMoveFicheProps) => {
  const collectiviteId = useCollectiviteId();
  const plan = useGetPlan(planId);
  const { mutateAsync: updateFiche } = useUpdateFiche({
    invalidatePlanId: planId,
  });

  const planAndAxe =
    plan && findCurrentPlanAndAxe([plan], planId, fiche, collectiviteId);
  const { currentPlan, currentAxeInPlan } = planAndAxe || {};

  // gestion de la sélection d'un emplacement
  const {
    selectedAxes,
    setSelectedAxes,
    handleSelectAxe,
    openParentAxesAndScrollToElement,
  } = useSelectAxes();

  // pour éviter de faire l'initialisation en boucle
  const initSelectionKeyRef = useRef<string | null>(null);

  // initialise les axes sélectionnés avec l'emplacement actuel
  useEffect(() => {
    if (!openState.isOpen || !currentPlan || !currentAxeInPlan) {
      return;
    }

    const initKey = `${planId}:${currentAxeInPlan.id}`;
    if (initSelectionKeyRef.current === initKey) {
      return;
    }

    const path = findAxePathInPlan(currentPlan.plan, currentAxeInPlan.id) || [];
    initSelectionKeyRef.current = initKey;
    setSelectedAxes(path);
  }, [
    openState.isOpen,
    currentPlan,
    currentAxeInPlan,
    planId,
    setSelectedAxes,
  ]);

  // évite de conserver l'état après la fermeture du dialogue
  useEffect(() => {
    if (!openState.isOpen) {
      initSelectionKeyRef.current = null;
    }
  }, [openState.isOpen]);

  // scroll automatique jusqu'à l'axe sélectionné après l'initialisation
  useEffect(() => {
    if (openState.isOpen && selectedAxes.length > 0) {
      // le setTimeout permet d'attendre que la mise à jour de 'selectedAxes' soit terminée
      // et que les colonnes soient bien affichées avant de scroller
      setTimeout(() => {
        const lastSelectedAxe = selectedAxes[selectedAxes.length - 1];
        const element = document.getElementById(
          lastSelectedAxe.axe.id.toString()
        );

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', inline: 'end' });
        }
      }, 0);
    }
  }, [openState.isOpen, selectedAxes]);

  // sauvegarde du déplacement de la fiche
  const handleSave = async () => {
    if (!selectedAxes.length) {
      return;
    }

    const { axe } = selectedAxes[selectedAxes.length - 1];
    const newAxeId = axe.id;

    // récupère tous les axes de la fiche sauf ceux du plan courant
    const axesFromOtherPlans =
      fiche.axes
        ?.filter((currentAxe) => {
          // garde les axes qui ne sont pas dans le plan courant
          return (
            currentAxe.collectiviteId !== collectiviteId ||
            currentAxe.planId !== planId
          );
        })
        .map((currentAxe) => ({
          id: currentAxe.id,
        })) || [];

    // ajoute le nouvel axe du plan courant
    const updatedAxes = [...axesFromOtherPlans, { id: newAxeId }];

    await updateFiche({
      ficheId: fiche.id,
      ficheFields: {
        axes: updatedAxes,
      },
    });

    openParentAxesAndScrollToElement(`fiche-${fiche.id}`);

    openState.setIsOpen(false);
  };

  const handleClose = () => {
    setSelectedAxes([]);
    openState.setIsOpen(false);
  };

  return {
    currentPlan,
    selectedAxes,
    handleSelectAxe,
    handleSave,
    handleClose,
  };
};
