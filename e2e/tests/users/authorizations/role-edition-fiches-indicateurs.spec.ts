/* eslint-disable playwright/expect-expect */
import { BulkEditRequest } from '@/domain/plans';
import { expect } from '@playwright/test';
import { testWithUsers as test } from '../users.fixture';

test.describe('Role edition fiches indicateurs', () => {
  test.beforeEach(async ({ page, users }) => {
    const { user, collectivite } = await users.addCollectiviteAndUserWithLogin(
      page.context(),
      {
        user: {
          permissionLevel: 'edition_fiches_indicateurs',
        },
      }
    );

    console.log(`Create fiches`);
    const createdFicheIds = await user.createFiches([
      {
        titre: 'Fiche test',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
      {
        titre: 'Deuxième fiche',
        collectiviteId: collectivite.data.id,
        statut: 'À venir',
      },
    ]);

    console.log(
      `Add pilotes ${
        user.data.userId
      } to fiches with ids ${createdFicheIds.join(',')} for collectivite ${
        collectivite.data.id
      }`
    );
    const bulkEditRequest: BulkEditRequest = {
      collectiviteId: collectivite.data.id,
      ficheIds: createdFicheIds,
      pilotes: {
        add: [{ userId: user.data.userId }],
      },
    };
    await user.bulkEditFiches(bulkEditRequest);

    page.goto('/');

    console.log('createdFicheIds', createdFicheIds);
  });

  test('Home page', async ({ page, users }) => {
    // We are on the personal tableaud de bord page
    await expect(page.getByText(/2\s*Actions pilotées/)).toBeVisible();
    await expect(
      page.getByText('Actions dont je suis le pilote')
    ).toBeVisible();
    await expect(page.getByText(/0\s*Indicateur piloté/)).toBeVisible();
    await expect(
      page.getByText('Indicateurs dont je suis le pilote')
    ).toBeVisible();
  });
});
