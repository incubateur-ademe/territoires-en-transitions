'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-provider';
import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import { SansPlanPlaceholder } from '@/app/tableaux-de-bord/plans-action/sans-plan.placeholder';

import Header from '../../_components/header';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  const { prenom } = useUser();
  const { nom, isReadOnly } = useCurrentCollectivite();

  const { data: plansActions } = usePlansActionsListe({});

  const hasPlan = plansActions ? plansActions.plans.length > 0 : false;

  return (
    <>
      <Header
        title={
          isReadOnly
            ? `Tableau de bord de la collectivité ${nom}`
            : `Bonjour ${prenom}`
        }
        subtitle={
          !isReadOnly ? 'Bienvenue sur Territoires en Transitions' : undefined
        }
        activeTab="personnel"
      />
      <div className="mt-8">
        <div className="flex flex-col gap-8 mt-8">
          <Metrics />
          {!hasPlan && <SansPlanPlaceholder />}
          <Modules hasPlan={hasPlan} />
        </div>
      </div>
    </>
  );
};

export default PersonnelPage;
