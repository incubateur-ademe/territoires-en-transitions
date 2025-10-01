import type { AppRouter } from '@/domain/trpc-router';
import { expect } from '@playwright/test';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createFiches } from 'e2e/tests/plans/fiches/fixtures/fiches.fixture';
import {
  fillAndSubmitLoginForm,
  goToAuthUrl,
} from 'e2e/tests/users/auth.utils';
import { testWithUsers as test } from '../../../users/users.fixture';

test.describe('Liste des fiches', () => {
  test.beforeEach(async ({ page, users }) => {
    const { user, collectivite } = await users.addCollectiviteAndUser();

    const fiches = await createFiches([
      {
        titre: 'Fiche test',
        collectiviteId: collectivite.id,
      },
    ]);
    await goToAuthUrl(page);
    await fillAndSubmitLoginForm(page, user.email, user.password);

    await page.locator('[data-test="nav-pa"]').click();

    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find(
      (cookie) => cookie.name === 'sb-127-auth-token'
    );
    console.log('cookies');
    console.log(tokenCookie);
    console.log(tokenCookie?.value);
    // Decode the value
    if (tokenCookie?.value) {
      const decodedValue = Buffer.from(
        tokenCookie?.value.replace('base64-', ''),
        'base64'
      ).toString('utf-8');
      console.log('decodedValue');
      console.log(decodedValue);
      const token = JSON.parse(decodedValue).access_token;
      console.log('token');
      console.log(token);

      const client = createTRPCClient<AppRouter>({
        links: [
          httpBatchLink({
            url: `http://localhost:8080/trpc`,
            // You can pass any HTTP headers you wish here
            async headers() {
              return {
                authorization: `Bearer ${token}`,
              };
            },
          }),
        ],
      });

      const createdFiche = client.plans.fiches.update.mutate({
        ficheId: fiches[0].id,
        ficheFields: {
          titre: 'Fiche test 2',
        },
      });
    }

    await page.locator('[data-test="pa-fa-toutes"]').click();
    await page.getByRole('heading', { name: 'Toutes les fiches' }).click();
  });

  test('Recherche texte', async ({ page, users }) => {
    await expect(page.locator('[data-test="FicheActionCarte"]')).toHaveCount(1);
  });
});
