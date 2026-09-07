import { mergeTests } from '@playwright/test';
import { testWithCollectivites } from './collectivite/collectivites.fixture';
import { testWithDiscussions } from './collectivite/discussions/discussions.fixture';
import { testWithPersonnalisations } from './collectivite/personnalisations/personnalisations.fixture';
import { testWithPersonneTags } from './collectivite/tags/personne-tags.fixture';
import { testWithIndicateurs } from './indicateurs/indicateurs.fixture';
import { testWithFiches } from './plans/fiches/fiches.fixture';
import { testWithPlans } from './plans/plans/plans.fixture';
import { testWithReferentiels } from './referentiels/referentiels.fixture';

export const test = mergeTests(
  testWithCollectivites,
  testWithPersonneTags,
  testWithDiscussions,
  testWithPlans,
  testWithFiches,
  testWithIndicateurs,
  testWithPersonnalisations,
  testWithReferentiels
).extend<{ oidcModal: 'hidden' | 'shown' }>({
  // La modale d'incitation MonCompteAdeme s'ouvre en overlay sur n'importe
  // quelle page authentifiée dès que le provider est activé — le cas en local,
  // pas en CI (MON_COMPTE_ADEME_ENABLED=false, cf. test-end-to-end.yml) — et
  // intercepte alors les clics. Elle est donc neutralisée par défaut, via le
  // drapeau de session que pose l'app elle-même (link-oidc-identity.modal.tsx).
  // Les specs qui la testent la réclament : `test.use({ oidcModal: 'shown' })`.
  oidcModal: ['hidden', { option: true }],
  page: async ({ page, oidcModal }, use) => {
    if (oidcModal === 'hidden') {
      await page.addInitScript(() =>
        window.sessionStorage.setItem('oidc-modal-seen', '1')
      );
    }
    await use(page);
  },
});
