import {monComptePath, rejoindreUneCollectivitePath} from 'app/paths';
import {ProfilRoutes} from './ProfileRoutes';
import SideNav, {SideNavLinks} from 'ui/shared/SideNav';

const Profil = () => {
  const links: SideNavLinks = [
    {
      link: monComptePath,
      displayName: 'Mon compte',
    },
    {
      link: rejoindreUneCollectivitePath,
      displayName: 'Rejoindre une collectivité',
    },
  ];
  return (
    <div className="fr-container !px-0">
      <div className="flex items-start">
        <SideNav links={links} />
        <div className="max-w-3xl w-full mt-14 mx-auto px-6">
          <ProfilRoutes />
        </div>
      </div>
    </div>
  );
};

export default Profil;
