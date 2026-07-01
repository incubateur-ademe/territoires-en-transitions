import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { ReferentielModeBannerPom } from './referentiel-mode-banner.pom';

test.describe('Bandeau mode référentiel', () => {
  test('affiche le bandeau readonly sur TE et pas sur CAE en write', async ({
    collectivites,
    page,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const supportUser = await collectivite.addUser({
      isSupport: true,
      isSuperAdminRoleEnabled: true,
    });

    await referentiels.setReferentielPreferences(
      supportUser,
      collectivite.data.id,
      {
        cae: { display: true, mode: 'write' },
        eci: { display: false, mode: 'archived' },
        te: { display: true, mode: 'readonly' },
      }
    );

    await user.precomputeReferentielSnapshot(collectivite.data.id, 'te');

    const bannerPom = new ReferentielModeBannerPom(page);

    await page.goto(
      `/collectivite/${collectivite.data.id}/referentiel/te/progression`
    );
    await expect(
      page.getByRole('heading', { name: 'Référentiel' })
    ).toBeVisible();
    await bannerPom.expectVisibleWithMode('readonly');

    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');

    await page.goto(
      `/collectivite/${collectivite.data.id}/referentiel/cae/progression`
    );
    await expect(
      page.getByRole('heading', { name: 'Référentiel' })
    ).toBeVisible();
    await bannerPom.expectHidden();
  });
});
