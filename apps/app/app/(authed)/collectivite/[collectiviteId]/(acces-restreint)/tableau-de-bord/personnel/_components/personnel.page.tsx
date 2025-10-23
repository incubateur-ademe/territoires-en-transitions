'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users/user-context/user-provider';
import { SansPlanPlaceholder } from '@/app/tableaux-de-bord/plans-action/sans-plan.placeholder';

import { useListPlans } from '@/app/plans/plans/list-all-plans/data/use-list-plans';
import Header from '../../_components/header';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  const { prenom } = useUser();
  const { nom, isReadOnly, collectiviteId } = useCurrentCollectivite();

  const { totalCount: plansCount } = useListPlans(collectiviteId);

  const hasPlan = plansCount > 0;

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
      <div className="flex flex-col gap-8 mt-8">
        <Metrics />
        {!hasPlan && <SansPlanPlaceholder />}
        <Modules hasPlan={hasPlan} />
      </div>
    </>
  );
};

export default PersonnelPage;
