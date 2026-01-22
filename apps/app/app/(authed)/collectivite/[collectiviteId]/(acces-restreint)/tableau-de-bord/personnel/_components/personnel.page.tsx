'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';

import Header from '../../_components/header';
import Metrics from './metrics';
import Modules from './modules';

const PersonnelPage = () => {
  const { prenom } = useUser();
  const { nom, hasCollectivitePermission } = useCurrentCollectivite();
  const canMutateCollectivite = hasCollectivitePermission(
    'collectivites.mutate'
  );

  return (
    <>
      <Header
        title={
          canMutateCollectivite
            ? `Bonjour ${prenom}`
            : `Tableau de bord de la collectivité ${nom}`
        }
        subtitle={
          canMutateCollectivite
            ? 'Bienvenue sur Territoires en Transitions'
            : undefined
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
