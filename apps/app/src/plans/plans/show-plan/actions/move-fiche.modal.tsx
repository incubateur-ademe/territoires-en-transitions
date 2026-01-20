import { useUpdateFiche } from '@/app/plans/fiches/update-fiche/data/use-update-fiche';
import { PlanListItem } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import { TProfondeurAxe } from '@/app/plans/plans/types';
import { useCollectiviteId } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { Button, Modal } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useEffect, useRef } from 'react';
import { ColonneTableauEmplacement } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/NouvelEmplacement/ColonneTableauEmplacement';
import { useSelectAxes } from '../../../fiches/show-fiche/header/actions/emplacement/EmplacementFiche/use-select-axes';
import { useGetPlan } from '../data/use-get-plan';
import { planNodeToProfondeurAxe } from './utils';

type FicheEmplacement = Pick<FicheWithRelations, 'id' | 'axes'>;

type MoveFicheModalProps = {
  fiche: FicheEmplacement;
  planId: number;
  isReadonly?: boolean;
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

  // scroll automatique horizontal jusqu'à l'axe sélectionné après l'initialisation
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

  if (!currentPlan) {
    return null;
  }

  return (
    <Modal
      dataTest="move-fiche.modal"
      title="Déplacer l'action"
      size="xl"
      onClose={() => {
        setSelectedAxes([]);
        openState.setIsOpen(false);
      }}
      openState={openState}
      render={({ descriptionId }) => (
        <div id={descriptionId} className="flex flex-col gap-8">
          {/* Arborescence du plan courant */}
          <div className="border border-grey-3 rounded-lg grid grid-flow-col auto-cols-[16rem] overflow-x-auto divide-x-[0.5px] divide-primary-3 py-3">
            <ColonneTableauEmplacement
              axesList={[currentPlan.plan]}
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

          {/* Bouton de validation */}
          <Button
            onClick={handleSave}
            disabled={!selectedAxes.length || isReadonly}
            aria-label="Valider"
            className="ml-auto"
          >
            Valider
          </Button>
        </div>
      )}
    />
  );
};

export default MoveFicheModal;
