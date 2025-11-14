'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { useUser } from '@/api/users';

import Header from '../../_components/header';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  const { prenom } = useUser();
  const { nom, isReadOnly } = useCurrentCollectivite();

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
        <Modules />
      </div>
    </>
  );
};

export default PersonnelPage;
