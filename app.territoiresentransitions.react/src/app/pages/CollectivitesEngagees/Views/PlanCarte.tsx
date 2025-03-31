import classNames from 'classnames';
import Link from 'next/link';

import { Badge } from '@/ui';

import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import { RecherchesPlan } from '@/api/collectiviteEngagees';

type Props = {
  plan: RecherchesPlan;
  canUserClickCard: boolean;
};

/**
 * Carte représentant un plan d'action.
 * Utilisée dans la vue collectivités engagées.
 *
 * Lien vers la page du plan.
 */
export const PlanCarte = ({ plan, canUserClickCard }: Props) => {
  const tracker = useFonctionTracker();

  return (
    <Link
      data-test="PlanCarte"
      onClick={() =>
        tracker({ fonction: 'collectivite_carte', action: 'clic' })
      }
      href={
        canUserClickCard
          ? makeCollectivitePlanActionUrl({
              collectiviteId: plan.collectiviteId,
              planActionUid: plan.planId.toString(),
            })
          : '#'
      }
      className={classNames(
        'flex flex-col gap-3 p-8 !bg-none bg-white rounded-xl border border-primary-3',
        {
          'cursor-default, pointer-events-none': !canUserClickCard,
          'hover:!bg-primary-2': canUserClickCard,
        }
      )}
    >
      <div className="text-lg font-bold text-primary-9">
        {plan.collectiviteNom}
      </div>
      {plan.planType && (
        <Badge
          title={generateTitle(plan.planType)}
          size="sm"
          state="standard"
        />
      )}
      <div className="text-sm text-grey-6">{generateTitle(plan.planNom)}</div>
    </Link>
  );
};
