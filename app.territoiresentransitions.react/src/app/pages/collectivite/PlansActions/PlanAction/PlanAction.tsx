'use client';
import { useState } from 'react';

import Arborescence from './DragAndDropNestedContainers/Arborescence';
import PlanActionFiltresAccordeon from './PlanActionFiltres/PlanActionFiltresAccordeon';
import PlanActionFooter from './PlanActionFooter';
import { PlanActionHeader } from './PlanActionHeader/PlanActionHeader';

import { CollectiviteNiveauAcces } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { AxeActions } from '@/app/app/pages/collectivite/PlansActions/PlanAction/AxeActions';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { TPlanType } from '@/app/types/alias';
import { Breadcrumbs } from '@/ui';
import { Spacer } from '@/ui/design-system/Spacer';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { useRouter } from 'next/navigation';
import { usePlanAction } from './data/server-actions/use-fetch-plan-action';
import { PlanNode } from './data/types';
import { checkAxeHasFiche } from './data/utils';

type PlanActionProps = {
  currentCollectivite: CollectiviteNiveauAcces;
  /** Axe racine du plan d'action (depth = 0) */
  rootAxe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
  viewMode: 'axe' | 'plan';
};

export const PlanAction = ({
  rootAxe,
  axes: initialAxes,
  currentCollectivite,
  planType,
  viewMode,
}: PlanActionProps) => {
  const router = useRouter();
  const axes = usePlanAction(rootAxe.id, {
    initialData: initialAxes,
  });

  const axe = axes.find((a) => a.id === rootAxe.id);
  if (!axe) {
    return <div>Axe non trouvé</div>;
  }
  // Permet de différentier une page axe d'une page plan
  const isAxePage = viewMode === 'axe';

  const axeHasFiche = checkAxeHasFiche(axe, axes);

  const [isFiltered, setIsFiltered] = useState(false);

  return (
    <div data-test={isAxePage ? 'PageAxe' : 'PlanAction'} className="w-full">
      <PlanActionHeader
        collectivite={currentCollectivite}
        plan={rootAxe}
        axe={axe}
        axes={axes}
        isAxePage={isAxePage}
        axeHasFiches={axeHasFiche}
        planType={planType}
      />
      <Spacer height={4} />
      <div className="bg-white rounded-md p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg text-primary-9 font-bold">
            Liste des actions
          </div>
          <VisibleWhen condition={currentCollectivite.isReadOnly === false}>
            <AxeActions
              plan={rootAxe}
              axe={axe}
              collectiviteId={currentCollectivite.collectiviteId}
            />
          </VisibleWhen>
        </div>
        <VisibleWhen condition={isAxePage}>
          <div className="py-6">
            <Breadcrumbs
              size="xs"
              items={[
                {
                  label: rootAxe.nom,
                  onClick: () =>
                    router.push(
                      makeCollectivitePlanActionUrl({
                        collectiviteId: currentCollectivite.collectiviteId,
                        planActionUid: axe.id.toString(),
                      })
                    ),
                },
                { label: axe.nom },
              ]}
            />
          </div>
        </VisibleWhen>
        {/**
         * Filtres
         * On vérifie si le plan ou l'axe contient des fiches pour afficher les filtres de fiche
         **/}
        <VisibleWhen condition={axeHasFiche}>
          <PlanActionFiltresAccordeon
            currentPlan={rootAxe}
            axe={axe}
            isAxePage={isAxePage}
            setIsFiltered={(isFiltered) => setIsFiltered(isFiltered)}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>
        <VisibleWhen condition={!isFiltered}>
          <Arborescence
            isReadOnly={currentCollectivite.isReadOnly}
            plan={rootAxe}
            axe={axe}
            axes={axes}
            isAxePage={isAxePage}
            collectivite={currentCollectivite}
          />
        </VisibleWhen>
        <PlanActionFooter />
      </div>
    </div>
  );
};
