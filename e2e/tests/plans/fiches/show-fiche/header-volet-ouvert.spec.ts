import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';

test.use({ viewport: { width: 1500, height: 1000 } });

test.describe('Header quand le volet latéral est ouvert', () => {
  test('le header reste en haut de page, garde toute sa largeur, et le volet passe par-dessus sa partie droite', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const [ficheId] = await fiches.create(adminUser, [
      { titre: 'Fiche courante', collectiviteId: collectivite.data.id },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/actions-liees`
    );
    await page.getByRole('button', { name: 'Lier une action' }).first().click();
    await expect(page.getByRole('complementary')).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));

    await expect
      .poll(() =>
        page.evaluate(() => {
          const headerBox = document
            .getElementById('app-header')
            ?.getBoundingClientRect();
          const panelElement = document.querySelector(
            'aside:not([aria-hidden="true"])'
          );
          const headerRightPoint = document.elementFromPoint(
            (headerBox?.right ?? 0) - 10,
            (headerBox?.top ?? 0) + 10
          );
          return {
            isHeaderAlignedWithPanelTop:
              headerBox?.top === panelElement?.getBoundingClientRect().top,
            headerLeft: headerBox?.left,
            isHeaderFullWidth:
              headerBox?.width === document.documentElement.clientWidth,
            isHeaderRightCoveredByPanel:
              panelElement?.contains(headerRightPoint) ?? false,
          };
        })
      )
      .toEqual({
        isHeaderAlignedWithPanelTop: true,
        headerLeft: 0,
        isHeaderFullWidth: true,
        isHeaderRightCoveredByPanel: true,
      });
  });

  test("sur mobile, le header recouvert par le volet ouvert n'est plus atteignable", async ({
    page,
    collectivites,
    fiches,
  }) => {
    await page.setViewportSize({ width: 800, height: 1000 });
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });
    const [ficheId] = await fiches.create(adminUser, [
      { titre: 'Fiche courante', collectiviteId: collectivite.data.id },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/actions-liees`
    );
    await expect(page.getByRole('banner')).toBeVisible();

    await page.getByRole('button', { name: 'Lier une action' }).first().click();

    await expect(page.getByRole('complementary')).toBeVisible();
    await expect(page.getByRole('banner')).toBeHidden();
  });
});
