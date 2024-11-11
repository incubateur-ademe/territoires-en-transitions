import Link from 'next/link';
import classNames from 'classnames';

import { Badge } from '@tet/ui';

import { useFonctionTracker } from 'core-logic/hooks/useFonctionTracker';
import { makeCollectivitePlanActionUrl } from 'app/paths';
import { generateTitle } from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { CollectiviteEngagee } from '@tet/api';

type Props = {
  plan: CollectiviteEngagee.TPlanCarte;
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
              collectiviteId: plan.collectivite_id,
              planActionUid: plan.id.toString(),
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
        {plan.collectivite.nom}
      </div>
      {plan.type && (
        <Badge
          title={generateTitle(plan.type.type)}
          size="sm"
          state="standard"
        />
      )}
      <div className="text-sm text-grey-6">{generateTitle(plan.nom)}</div>
    </Link>
  );
};
