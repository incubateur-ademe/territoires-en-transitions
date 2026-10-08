import {
  makeCollectiviteDemarchePcaetUrl,
  makeReferentielActionUrl,
  makeReferentielUrl,
  referentielTabs,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import type {
  CollectiviteReferentielPreferenceId,
  CollectiviteReferentielPreferences,
  ReferentielDisplayMap,
} from '@tet/domain/collectivites';
import type {
  CollectiviteNavItem,
  CollectiviteNavLink,
} from './make-collectivite-nav.contract';

function isReferentielDisplayed(
  display: ReferentielDisplayMap,
  referentielId: CollectiviteReferentielPreferenceId
): boolean {
  return Boolean(display[referentielId]);
}

function isReferentielArchived(
  preferences: CollectiviteReferentielPreferences | undefined,
  referentielId: CollectiviteReferentielPreferenceId
): boolean {
  return preferences?.[referentielId]?.mode === 'archived';
}

/**
 * Libellé du référentiel dans la nav : suffixé "(archivé)" quand le
 * référentiel a été archivé tout en restant consultable.
 */
function referentielNavLabel(
  baseLabel: string,
  preferences: CollectiviteReferentielPreferences | undefined,
  referentielId: CollectiviteReferentielPreferenceId
): string {
  return isReferentielArchived(preferences, referentielId)
    ? appLabels.referentielArchiveSuffixe(baseLabel)
    : baseLabel;
}

function makeReferentielNavLink({
  collectiviteId,
  referentielId,
  label,
  dataTest,
  isVisible,
}: {
  collectiviteId: number;
  referentielId: CollectiviteReferentielPreferenceId;
  label: string;
  dataTest: string;
  isVisible: boolean;
}): CollectiviteNavLink {
  return {
    children: label,
    dataTest,
    isVisible,
    href: makeReferentielUrl({ collectiviteId, referentielId }),
    urlPrefix: [
      ...referentielTabs.map((referentielTab) =>
        makeReferentielUrl({ collectiviteId, referentielId, referentielTab })
      ),
      makeReferentielActionUrl({ collectiviteId, referentielId, actionId: '' }),
    ],
  };
}

export const generateEdlDropdown = ({
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
  referentielsDisplay,
  referentielsPreferences,
  isDemarchePcaetEnabled,
}: {
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
  referentielsDisplay: ReferentielDisplayMap;
  referentielsPreferences?: CollectiviteReferentielPreferences;
  isDemarchePcaetEnabled?: boolean;
}): CollectiviteNavItem => {
  const teLink = makeReferentielNavLink({
    collectiviteId,
    referentielId: 'te',
    label: referentielNavLabel(
      appLabels.referentielTransitionEcologique,
      referentielsPreferences,
      'te'
    ),
    dataTest: 'edl-te',
    isVisible: isReferentielDisplayed(referentielsDisplay, 'te'),
  });
  const caeLink = makeReferentielNavLink({
    collectiviteId,
    referentielId: 'cae',
    label: referentielNavLabel(
      appLabels.referentielClimatAirEnergie,
      referentielsPreferences,
      'cae'
    ),
    dataTest: 'edl-cae',
    isVisible: isReferentielDisplayed(referentielsDisplay, 'cae'),
  });
  const eciLink = makeReferentielNavLink({
    collectiviteId,
    referentielId: 'eci',
    label: referentielNavLabel(
      appLabels.referentielEconomieCirculaire,
      referentielsPreferences,
      'eci'
    ),
    dataTest: 'edl-eci',
    isVisible: isReferentielDisplayed(referentielsDisplay, 'eci'),
  });

  // Les référentiels actifs gardent l'ordre historique (CAE, ECI puis Climat
  // Ressources). Les référentiels archivés, restés consultables, sont regroupés
  // à leur suite, avant la démarche PCAET.
  const referentielLinks = [
    { referentielId: 'cae', link: caeLink },
    { referentielId: 'eci', link: eciLink },
    { referentielId: 'te', link: teLink },
  ] as const;
  const activeLinks = referentielLinks
    .filter(
      ({ referentielId }) =>
        !isReferentielArchived(referentielsPreferences, referentielId)
    )
    .map(({ link }) => link);
  const archivedLinks = referentielLinks
    .filter(({ referentielId }) =>
      isReferentielArchived(referentielsPreferences, referentielId)
    )
    .map(({ link }) => link);

  return {
    isVisible: !(collectiviteAccesRestreint && isVisitor),
    children: appLabels.programmesEtDemarches,
    dataTest: 'nav-edl',
    links: [
      ...activeLinks,
      ...archivedLinks,
      {
        isVisible: isDemarchePcaetEnabled,
        children: appLabels.navDemarchePcaet,
        dataTest: 'edl-demarche-pcaet',
        href: makeCollectiviteDemarchePcaetUrl({ collectiviteId }),
        urlPrefix: [makeCollectiviteDemarchePcaetUrl({ collectiviteId })],
      },
    ],
  };
};
