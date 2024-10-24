import { monComptePath } from 'app/paths';
import { ProfilRoutes } from './ProfileRoutes';
import { getRejoindreCollectivitePath } from '@tet/api';
import CollectivitePageLayout from '@tet/app/pages/collectivite/CollectivitePageLayout/CollectivitePageLayout';

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
            link: getRejoindreCollectivitePath(
              document.location.hostname,
              document.location.origin
            ),
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
