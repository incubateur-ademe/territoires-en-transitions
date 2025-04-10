import classNames from 'classnames';

import { Badge, Card } from '@/ui';

import { RecherchesPlan } from '@/api/collectiviteEngagees';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { useFonctionTracker } from '@/app/core-logic/hooks/useFonctionTracker';
import ContactsDisplay from '../contacts/contacts-display';

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
    <div className="relative h-full group">
      <ContactsDisplay
        view="plans"
        contacts={plan.contacts}
        collectiviteName={plan.collectiviteNom}
        buttonClassName="!absolute top-4 right-4 invisible group-hover:visible"
      />

      <Card
        data-test="PlanCarte"
        className={classNames('h-full !border-primary-3 !py-5 !px-6 !gap-3', {
          'hover:!bg-primary-0': canUserClickCard,
        })}
        onClick={() =>
          tracker({ fonction: 'collectivite_carte', action: 'clic' })
        }
        href={
          canUserClickCard
            ? makeCollectivitePlanActionUrl({
                collectiviteId: plan.collectiviteId,
                planActionUid: plan.planId.toString(),
              })
            : undefined
        }
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
        <div className="text-xs text-grey-6 font-bold">
          {generateTitle(plan.planNom)}
        </div>
      </Card>
    </div>
  );
};
