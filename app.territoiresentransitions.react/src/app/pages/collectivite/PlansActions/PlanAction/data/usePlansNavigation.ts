import {useQuery} from 'react-query';

import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {FlatAxe, PlanNode} from './types';
import {buildPlans} from './utils';
import {SideNavLinks} from 'ui/shared/SideNav';
import {
  makeCollectiviteFichesNonClasseesUrl,
  makeCollectivitePlanActionAxeUrl,
  makeCollectivitePlanActionUrl,
  makeCollectivitePlansActionsSyntheseUrl,
} from 'app/paths';
import {generateTitle} from '../../FicheAction/data/utils';

export const usePlansNavigation = () => {
  const collectivite_id = useCollectiviteId();

  return useQuery(['plans_navigation', collectivite_id], async () => {
    const {data} = await supabaseClient.rpc('navigation_plans', {
      collectivite_id: collectivite_id!,
    });
    return buildPlans(data as unknown as FlatAxe[]) as unknown as PlanNode[];
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
  plans?: PlanNode[],
  fichesNonClasseesTotal?: number | null
) => {
  const plansLinks: SideNavLinks = [
    {
      link: makeCollectivitePlansActionsSyntheseUrl({
        collectiviteId,
      }),
      displayName: 'Synthèse',
    },
  ];

  if (plans) {
    plansLinks.push(
      ...plans.map(plan => {
        if (plan.children && plan.children.length > 0) {
          return {
            link: makeCollectivitePlanActionUrl({
              collectiviteId,
              planActionUid: plan.id.toString(),
            }),
            displayName: generateTitle(plan.nom),
            enfants: plan.children.map(e => ({
              link: makeCollectivitePlanActionAxeUrl({
                collectiviteId,
                planActionUid: plan.id.toString(),
                axeUid: e.id.toString(),
              }),
              displayName: generateTitle(e.nom),
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

  if (fichesNonClasseesTotal && fichesNonClasseesTotal > 0) {
    plansLinks.push({
      link: makeCollectiviteFichesNonClasseesUrl({
        collectiviteId,
      }),
      displayName: 'Fiches non classées',
    });
  }

  return plansLinks;
};
