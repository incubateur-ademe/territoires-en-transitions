import {
  makeReferentielActionUrl,
  makeReferentielLabellisationUrl,
  makeReferentielRootUrl,
  makeReferentielUrl,
  referentielTabs,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type {
  CollectiviteReferentielDisplayId,
  ReferentielDisplayMap,
} from '@tet/domain/collectivites';
import { CollectiviteNavItem } from './make-collectivite-nav';

function isReferentielDisplayed(
  display: ReferentielDisplayMap,
  referentielId: CollectiviteReferentielDisplayId
): boolean {
  return Boolean(display[referentielId]);
}

export const generateEdlDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
  referentielsDisplay,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
  referentielsDisplay: ReferentielDisplayMap;
}): CollectiviteNavItem => ({
  isVisible: !(collectiviteAccesRestreint && isVisitor),
  children: appLabels.navEtatDesLieux,
  dataTest: 'nav-edl',
  links: [
    {
      children: appLabels.navTableauDeBordEtatDesLieux,
      href: makeReferentielRootUrl({ collectiviteId }),
      dataTest: 'edl-synthese',
    },
    {
      children: appLabels.navReferentielClimatAirEnergie,
      dataTest: 'edl-cae',
      isVisible: isReferentielDisplayed(referentielsDisplay, 'cae'),
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
      children: appLabels.navLabellisationClimatAirEnergie,
      dataTest: 'labellisation-cae',
      isVisible: isReferentielDisplayed(referentielsDisplay, 'cae'),
      href: makeReferentielLabellisationUrl({
        collectiviteId,
        referentielId: 'cae',
      }),
      urlPrefix: ['cae/labellisation'],
    },
    {
      children: appLabels.navReferentielEconomieCirculaire,
      dataTest: 'edl-eci',
      isVisible: isReferentielDisplayed(referentielsDisplay, 'eci'),
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
      children: appLabels.navLabellisationEconomieCirculaire,
      dataTest: 'labellisation-eci',
      isVisible: isReferentielDisplayed(referentielsDisplay, 'eci'),
      href: makeReferentielLabellisationUrl({
        collectiviteId,
        referentielId: 'eci',
      }),
      urlPrefix: ['eci/labellisation'],
    },
    {
      children: appLabels.navReferentielTransitionEcologique,
      isVisible: isReferentielDisplayed(referentielsDisplay, 'te'),
      dataTest: 'edl-te',
      href: makeReferentielUrl({
        collectiviteId,
        referentielId: 'te',
      }),
      urlPrefix: [
        ...referentielTabs.map((referentielTab) =>
          makeReferentielUrl({
            collectiviteId,
            referentielId: 'te',
            referentielTab,
          })
        ),
        makeReferentielActionUrl({
          collectiviteId,
          referentielId: 'te',
          actionId: '',
        }),
      ],
    },
  ],
});
