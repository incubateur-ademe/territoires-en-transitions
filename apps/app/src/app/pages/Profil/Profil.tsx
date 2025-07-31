import { getRejoindreCollectivitePath } from '@/api';
import CollectivitePageLayout from '@/app/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';
import { monComptePath } from '@/app/app/paths';
import { ProfilRoutes } from './ProfileRoutes';

const Profil = () => {
  return (
    <CollectivitePageLayout
      sideNav={{
        isHideable: false,
        links: [
          {
            link: monComptePath,
            displayName: 'Mon compte',
          },
          {
            link: getRejoindreCollectivitePath(document.location.origin),
            displayName: 'Rejoindre une collectivité',
          },
        ],
      }}
    >
      <div className="max-w-3xl w-full my-14 mx-auto px-6">
        <ProfilRoutes />
      </div>
    </CollectivitePageLayout>
  );
};

export default Profil;
