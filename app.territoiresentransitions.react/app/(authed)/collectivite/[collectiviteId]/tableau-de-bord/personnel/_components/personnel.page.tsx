'use client';

import { usePlansActionsListe } from '@/app/app/pages/collectivite/PlansActions/PlanAction/data/usePlansActionsListe';
import { useCurrentCollectivite } from '@/app/collectivites/collectivite-context';
import SansPlanPlaceholder from '@/app/tableaux-de-bord/plans-action/sans-plan.placeholder';

import { useUser } from '@/api/users/user-provider';

import Header from '../../_components/header';
import Modules from '../_components/modules';

const PersonnelPage = () => {
  const { prenom } = useUser();
  const { nom, isReadOnly } = useCurrentCollectivite();

  const { data: plansActions } = usePlansActionsListe({});

  return (
    <>
      <Header
        title={
          isReadOnly
            ? `Tableau de bord de la collectivité ${nom}`
            : `Bonjour ${prenom}`
        }
        subtitle={
          !isReadOnly ? 'Bienvenue sur Territoires en transitions' : undefined
        }
        activeTab="personnel"
      />
      <div className="mt-8">
        {plansActions?.plans.length === 0 ? (
          <SansPlanPlaceholder />
        ) : (
          <div className="flex flex-col gap-8 mt-6">
            <Modules />
          </div>
        )}
      </div>
    </>
  );
};

export default PersonnelPage;
