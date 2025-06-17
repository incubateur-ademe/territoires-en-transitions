'use client';
import { useState } from 'react';

import Arborescence from './DragAndDropNestedContainers/Arborescence';
import PlanActionFiltresAccordeon from './PlanActionFiltres/PlanActionFiltresAccordeon';
import PlanActionFooter from './PlanActionFooter';
import { PlanActionHeader } from './PlanActionHeader/PlanActionHeader';

import { CollectiviteNiveauAccess } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { TPlanType } from '@/app/types/alias';
import { Breadcrumbs } from '@/ui';
import { useRouter } from 'next/navigation';
import { generateTitle } from '../FicheAction/data/utils';
import { PlanNode } from './data/types';
import { checkAxeHasFiche } from './data/utils';

type PlanActionProps = {
  currentCollectivite: CollectiviteNiveauAccess;
  /** Axe racine du plan d'action (depth = 0) */
  currentPlan: PlanNode;
  /** Axe utilisé pour toutes les actions, que ce soit l'axe racine ou inférieur */
  axe: PlanNode;
  /** La liste des axes liés à ce plan d'action */
  axes: PlanNode[];
  /** Type du plan d'action */
  planType: TPlanType | null;
};

export const PlanAction = ({
  currentPlan,
  axe,
  axes,
  currentCollectivite,
  planType,
}: PlanActionProps) => {
  const router = useRouter();

  // Permet de différentier une page axe d'une page plan
  const isAxePage = axe.depth === 1;

  const axeHasFiche = checkAxeHasFiche(axe, axes);

  const [isFiltered, setIsFiltered] = useState(false);

  return (
    <div data-test={isAxePage ? 'PageAxe' : 'PlanAction'} className="w-full">
      {/** Header */}
      <PlanActionHeader
        collectivite={currentCollectivite}
        plan={currentPlan}
        axe={axe}
        axes={axes}
        isAxePage={isAxePage}
        axeHasFiches={axeHasFiche}
        planType={planType}
      />
      <div className="mx-auto px-10">
        {/** Lien plan d'action page axe */}
        {isAxePage && (
          <div className="py-6">
            <Breadcrumbs
              size="xs"
              items={[
                {
                  label: generateTitle(currentPlan.nom),
                  onClick: () =>
                    router.push(
                      makeCollectivitePlanActionUrl({
                        collectiviteId: currentCollectivite.id,
                        planActionUid: axe.id.toString(),
                      })
                    ),
                },
                { label: generateTitle(axe.nom) },
              ]}
            />
          </div>
        )}
        {/**
         * Filtres
         * On vérifie si le plan ou l'axe contient des fiches pour afficher les filtres de fiche
         **/}
        {axeHasFiche && (
          <PlanActionFiltresAccordeon
            currentPlan={currentPlan}
            axe={axe}
            isAxePage={isAxePage}
            setIsFiltered={(isFiltered) => setIsFiltered(isFiltered)}
            collectivite={currentCollectivite}
          />
        )}
        {/** Arboresence (fiches + sous-axes) */}
        {!isFiltered && (
          <Arborescence
            isReadOnly={currentCollectivite.isReadOnly}
            plan={currentPlan}
            axe={axe}
            axes={axes}
            isAxePage={isAxePage}
            collectivite={currentCollectivite}
          />
        )}
        {/** Footer */}
        <PlanActionFooter />
      </div>
    </div>
  );
};
