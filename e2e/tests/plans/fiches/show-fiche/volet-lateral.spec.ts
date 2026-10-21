import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';

test.use({ viewport: { width: 1500, height: 1000 } });

test.describe('Volet latéral d’une fiche', () => {
  test('le tableau des actions liées est dans un conteneur défilable qui s’arrête avant le volet', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const [ficheId, ficheLieeId] = await fiches.create(adminUser, [
      { titre: 'Fiche courante', collectiviteId: collectivite.data.id },
      { titre: 'Fiche liée', collectiviteId: collectivite.data.id },
    ]);
    await adminUser.getTrpcClient().plans.fiches.update.mutate({
      ficheId,
      ficheFields: { fichesLiees: [{ id: ficheLieeId }] },
    });

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/actions-liees`
    );
    await page.getByRole('button', { name: 'Lier une action' }).first().click();
    await expect(page.getByRole('complementary')).toBeVisible();

    const table = await page.evaluate(() => {
      const panelLeft = document
        .querySelector('aside:not([aria-hidden="true"])')
        ?.getBoundingClientRect().left;
      const tableElement = document.querySelector('table');
      const scrollContainer = (() => {
        for (
          let element = tableElement?.parentElement ?? null;
          element;
          element = element.parentElement
        ) {
          if (getComputedStyle(element).overflowX === 'auto') return element;
        }
        return null;
      })();
      return {
        panelLeft,
        scrollContainerRight: scrollContainer?.getBoundingClientRect().right,
      };
    });

    expect(table.scrollContainerRight).toBeDefined();
    expect(table.scrollContainerRight).toBeLessThanOrEqual(
      table.panelLeft ?? 0
    );
  });
});
