import { useQuery } from 'react-query';

import { useCollectiviteId } from '@/api/collectivites';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionAxeUrl,
  makeCollectivitePlanActionUrl,
} from '@/app/app/paths';
import { FlatAxe, PlanNode } from '@/backend/plans/plans/plans.schema';
import {
  childrenOfPlanNodes,
  flatAxesToPlanNodes,
  sortPlanNodes,
} from '../../../../../../plans/plans/utils';
import { SideNavLinks } from '../../../CollectivitePageLayout/SideNav';
import { generateTitle } from '../../FicheAction/data/utils';

export const usePlansNavigation = () => {
  const collectivite_id = useCollectiviteId();
  const supabase = useSupabase();

  return useQuery(['plans_navigation', collectivite_id], async () => {
    const { data } = await supabase.rpc('navigation_plans', {
      collectivite_id: collectivite_id!,
    });
    const planNodes = data && flatAxesToPlanNodes(data as FlatAxe[]);
    return planNodes ?? [];
  });
};

/**
 * Génère une liste de lien pour la SideNav à partir d'une liste de plans d'action
 * @param plans
 * @param fichesNonClasseesTotal
 * @returns
 */
export const generatePlanActionNavigationLinks = (
  collectiviteId: number,
  hasFichesNonClassees: boolean,
  axes?: PlanNode[] | null
) => {
  const plansLinks: SideNavLinks = [];

  const plans = axes && sortPlanNodes(axes.filter((axe) => axe.depth === 0));

  if (axes && plans) {
    plansLinks.push(
      ...plans.map((plan) => {
        if (childrenOfPlanNodes(plan, axes).length > 0) {
          return {
            link: makeCollectivitePlanActionUrl({
              collectiviteId,
              planActionUid: plan.id.toString(),
            }),
            displayName: generateTitle(plan.nom),
            enfants: childrenOfPlanNodes(plan, axes).map((axe) => ({
              link: makeCollectivitePlanActionAxeUrl({
                collectiviteId,
                planActionUid: plan.id.toString(),
                axeUid: axe.id.toString(),
              }),
              displayName: generateTitle(axe.nom),
            })),
          };
        } else {
          return {
            link: makeCollectivitePlanActionUrl({
              collectiviteId,
              planActionUid: plan.id.toString(),
            }),
            displayName: generateTitle(plan.nom),
          };
        }
      })
    );
  }

  if (hasFichesNonClassees) {
    plansLinks.push({
      link: makeCollectiviteFichesNonClasseesUrl({
        collectiviteId,
      }),
      displayName: 'Fiches non classées',
    });
  }

  return plansLinks;
};
