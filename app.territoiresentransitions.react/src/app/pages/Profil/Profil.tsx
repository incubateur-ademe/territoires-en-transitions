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
      <div className="grid grid-cols-[21rem_1fr] ml-6">
        <div className="mt-6 border-r border-gray-100">
          <SideNav links={links} />
        </div>
        <div className="max-w-3xl w-full my-14 mx-auto px-6">
          <ProfilRoutes />
        </div>
      </div>
    </div>
  );
};

export default Profil;
