import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_COUNT = 29;

test.describe('Priorisation des leviers', () => {
  test('un membre de la collectivité voit les 29 leviers', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);
  });

  test('un utilisateur vérifié non membre voit les 29 leviers', async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);
  });

  test("un utilisateur vérifié non membre ne voit pas les leviers d'une collectivité en accès restreint", async ({
    collectivites,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({
      accesRestreint: true,
    });
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.open(collectivite.data.id);

    await expect(
      page.getByText("Cette collectivité n'est pas accessible en mode visite.")
    ).toBeVisible();
    await expect(priorisationLeviersPom.levierNames).toHaveCount(0);
  });
});
