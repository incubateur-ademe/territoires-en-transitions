import classNames from 'classnames';

import { Badge, Card, Event, useEventTracker } from '@/ui';

import { CollectiviteEngagee } from '@/api';
import { generateTitle } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/utils';
import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import ContactsDisplay from '../../contacts/contacts-display';

type Props = {
  plan: CollectiviteEngagee.RecherchesPlan;
  isClickable: boolean;
};

/**
 * Carte représentant un plan d'action.
 * Utilisée dans la vue collectivités engagées.
 *
 * Lien vers la page du plan.
 */
export const PlanCarte = ({ plan, isClickable }: Props) => {
  const tracker = useEventTracker();

  return (
    <div className="relative h-full group">
      <ContactsDisplay
        view="plans"
        contacts={plan.contacts}
        collectiviteName={plan.collectiviteNom}
        buttonClassName="!absolute top-4 right-4 invisible group-hover:visible"
        onButtonClick={() => tracker(Event.recherches.viewContacts)}
      />

      <Card
        data-test="PlanCarte"
        className={classNames('h-full !border-primary-3 !py-5 !px-6 !gap-3', {
          'hover:!bg-primary-0': isClickable,
        })}
        onClick={() => tracker(Event.recherches.viewPlan)}
        href={
          isClickable
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
