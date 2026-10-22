import {
  makeCollectiviteUsersUrl,
  makeDemandesAvisUrl,
  makeReferentsPcaetUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { filterNavItems } from './make-collectivite-nav';

export const makeServiceDeconcentreNav = ({
  user,
  currentCollectivite,
  canReadReferentsPcaet,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
  canReadReferentsPcaet: boolean;
}): HeaderProps['mainNav'] => {
  const { collectiviteId } = currentCollectivite;

  return {
    startItems: [
      {
        children: appLabels.instructionTitre,
        className: 'self-stretch',
        href: makeDemandesAvisUrl({ collectiviteId }),
      },
      {
        children: appLabels.gestionDesUtilisateurs,
        className: 'self-stretch',
        dataTest: 'params-membres',
        href: makeCollectiviteUsersUrl({ collectiviteId }),
      },
    ],
    endItems: filterNavItems([
      {
        isVisible: canReadReferentsPcaet,
        children: appLabels.referentsPcaetMenuConfiguration,
        icon: 'settings-3-line',
        dataTest: 'nav-configuration',
        links: [
          {
            children: appLabels.referentsPcaetTitre,
            dataTest: 'nav-referents-pcaet',
            href: makeReferentsPcaetUrl({ collectiviteId }),
          },
        ],
      },
      generateCollectiviteNavItem({ user, currentCollectivite }),
    ]),
  };
};
