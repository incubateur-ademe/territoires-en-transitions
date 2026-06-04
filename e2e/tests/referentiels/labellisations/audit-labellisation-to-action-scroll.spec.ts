import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

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

        await page.waitForFunction((id) => {
          const el = document.getElementById(id);
          if (!el) return false;
          const top = el.getBoundingClientRect().top;
          const w = window as unknown as { __prevTop?: number };
          const previous = w.__prevTop;
          w.__prevTop = top;
          return previous !== undefined && Math.abs(previous - top) < 0.5;
        }, resolvedId);

        const stickyBottom = await page.evaluate(() => {
          const sticky = document.querySelector<HTMLElement>(
            '[data-sticky-header]'
          );
          if (!sticky) throw new Error('Header sticky introuvable');
          return sticky.getBoundingClientRect().bottom;
        });

        const targetBox = await targetCard.boundingBox();
        if (!targetBox) throw new Error('Sous-action cible introuvable');

        expect(targetBox.y).toBeGreaterThanOrEqual(stickyBottom);
      }
    );
  }
);
