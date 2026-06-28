import { expect } from '@playwright/test';
import { bannerInfoTable } from '@tet/backend/utils/banner/banner-info.table';
import { databaseService } from 'tests/shared/database.service';
import { test } from 'tests/main.fixture';

test.describe('Bannière info (support)', () => {
  test.afterEach(async () => {
    // Wipe banner_info between tests so the partial unique index never
    // collides with the next run and no stale row leaks into other tests.
    await databaseService.db.delete(bannerInfoTable);
  });

  test("Un support en mode super-admin publie une bannière, l'utilisateur la voit, puis la désactive", async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: {
        autoLogin: true,
        isSupport: true,
        isSuperAdminRoleEnabled: true,
      },
    });

    await page.goto('/');

    // Navigate to the banner edit page from the Super Admin menu
    await expect(
      page.getByRole('button', { name: 'Super Admin' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Super Admin' }).click();
    await page.getByRole('link', { name: 'Bannière' }).click();

    await expect(page.getByRole('heading', { name: 'Bannière' })).toBeVisible();

    // The RichTextEditor exposes role="textbox" with the configured aria-label —
    // a more stable locator than the internal .ProseMirror class. Typing
    // sequentially ensures BlockNote's `isContentInitialized` gate flips on
    // the first char and subsequent chars propagate to the form via onChange.
    const editor = page.getByRole('textbox', {
      name: 'Contenu de la bannière',
    });
    await editor.click();
    await editor.pressSequentially('Maintenance prévue ce week-end');

    // Activate the banner
    await page.getByRole('checkbox', { name: 'Bannière active' }).check();

    // The Save button is gated on debounced form state propagation — wait for
    // it to be enabled before clicking, instead of racing the click.
    const saveButton = page.getByRole('button', { name: 'Enregistrer' });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for the banner to render in the widget at the top of the page —
    // it is rendered globally inside <SuperAdminModeProvider> on every authed page.
    await expect(
      page.getByText('Maintenance prévue ce week-end').first()
    ).toBeVisible();

    // Navigate to the home page and confirm the banner persists for any
    // authed user route.
    await page.goto('/');
    await expect(
      page.getByText('Maintenance prévue ce week-end').first()
    ).toBeVisible();

    // Deactivate the banner from the edit page by unchecking the active
    // checkbox and saving — there's no dedicated "Désactiver" button.
    await page.getByRole('button', { name: 'Super Admin' }).click();
    await page.getByRole('link', { name: 'Bannière' }).click();
    await page.getByRole('checkbox', { name: 'Bannière active' }).uncheck();

    const saveButtonAfterUncheck = page.getByRole('button', {
      name: 'Enregistrer',
    });
    await expect(saveButtonAfterUncheck).toBeEnabled();
    await saveButtonAfterUncheck.click();

    // Re-navigate and confirm the banner has disappeared
    await page.goto('/');
    await expect(
      page.getByText('Maintenance prévue ce week-end')
    ).toHaveCount(0);
  });

  test("La page /banniere est invisible pour un utilisateur sans rôle support", async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: {
        autoLogin: true,
        // no isSupport — regular collectivite user
      },
    });

    await page.goto('/');

    // The "Super Admin" entry should not be in the nav at all
    await expect(
      page.getByRole('button', { name: 'Super Admin' })
    ).toHaveCount(0);
  });
});
