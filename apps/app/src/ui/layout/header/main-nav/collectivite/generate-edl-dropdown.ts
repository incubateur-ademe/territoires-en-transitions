import {
  makeCollectivitePersoRefUrl,
  makeReferentielActionUrl,
  makeReferentielLabellisationUrl,
  makeReferentielRootUrl,
  makeReferentielUrl,
  referentielTabs,
} from '@/app/app/paths';
import { isVisitor } from '@tet/domain/users';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateEdlDropdown = ({
  collectiviteId,
}: {
  collectiviteId: number;
}): CollectiviteNavItem => ({
  isVisibleWhen: (user, accesRestreint) =>
    !(accesRestreint && isVisitor(user, { collectiviteId })),
  children: 'État des lieux',
  dataTest: 'nav-edl',
  links: [
    {
      children: 'Tableau de bord État des Lieux',
      href: makeReferentielRootUrl({ collectiviteId }),
      dataTest: 'edl-synthese',
    },
    {
      children: 'Personnalisation des référentiels',
      href: makeCollectivitePersoRefUrl({
        collectiviteId,
      }),
      dataTest: 'edl-personnalisation',
    },
    {
      children: 'Référentiel Climat-Air-Énergie',
      dataTest: 'edl-cae',
      href: makeReferentielUrl({
        collectiviteId,
        referentielId: 'cae',
      }),
      urlPrefix: [
        ...referentielTabs.map((referentielTab) =>
          makeReferentielUrl({
            collectiviteId,
            referentielId: 'cae',
            referentielTab,
          })
        ),
        makeReferentielActionUrl({
          collectiviteId,
          referentielId: 'cae',
          actionId: '',
        }),
      ],
    },
    {
      children: 'Labellisation Climat-Air-Énergie',
      dataTest: 'labellisation-cae',
      href: makeReferentielLabellisationUrl({
        collectiviteId,
        referentielId: 'cae',
      }),
      urlPrefix: ['cae/labellisation'],
    },
    {
      children: 'Référentiel Économie Circulaire',
      dataTest: 'edl-eci',
      href: makeReferentielUrl({
        collectiviteId,
        referentielId: 'eci',
      }),
      urlPrefix: [
        ...referentielTabs.map((referentielTab) =>
          makeReferentielUrl({
            collectiviteId,
            referentielId: 'eci',
            referentielTab,
          })
        ),
        makeReferentielActionUrl({
          collectiviteId,
          referentielId: 'eci',
          actionId: '',
        }),
      ],
    },
    {
      children: 'Labellisation Économie Circulaire',
      dataTest: 'labellisation-eci',
      href: makeReferentielLabellisationUrl({
        collectiviteId,
        referentielId: 'eci',
      }),
      urlPrefix: ['eci/labellisation'],
    },
  ],
});
