import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';
import {
  stickyHeaderBottom,
  waitForScrollSettled,
} from '../sticky-header.helpers';

const referentiel: ReferentielId = 'eci';

test.describe(
  "Navigation client-side audit-labellisation → page action : scroll vers le hash",
  () => {
    test(
      "clic « Voir la mesure » : le header de la sous-action cible n'est pas masqué par le header sticky",
      async ({ page, collectivites, newAuditLabellisationPom }) => {
        const { collectivite, user } =
          await collectivites.addCollectiviteAndUser({
            userArgs: { autoLogin: true },
          });
        const collectiviteId = collectivite.data.id;
        await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

        await newAuditLabellisationPom.goto(collectiviteId, referentiel);

        const voirLaMesureLink = page
          .getByRole('link', { name: 'Voir la mesure' })
          .first();
        await expect(voirLaMesureLink).toBeVisible();
        await voirLaMesureLink.click();

        await expect(page).toHaveURL(/#eci_/);
        const hash = new URL(page.url()).hash.slice(1);

        const segments = hash.split('.');
        const candidateIds = Array.from({ length: 3 }, (_, depth) =>
          segments.slice(0, segments.length - depth).join('.')
        ).filter(Boolean);
        const targetCard = page
          .locator(candidateIds.map((id) => `[id="${id}"]`).join(', '))
          .first();
        await expect(targetCard).toBeVisible();

        const resolvedId = await targetCard.getAttribute('id');
        if (!resolvedId) throw new Error('id introuvable sur la carte cible');

        await waitForScrollSettled(page, resolvedId);

        const stickyBottom = await stickyHeaderBottom(page);
        const targetBox = await targetCard.boundingBox();
        if (!targetBox) throw new Error('Sous-action cible introuvable');

        expect(targetBox.y).toBeGreaterThanOrEqual(stickyBottom);
      }
    );
  }
);
