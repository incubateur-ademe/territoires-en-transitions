import { expect } from '@playwright/test';
import { LevierMobilisation } from '@tet/backend/collectivites/analysis/mobilisation.repository';
import { Levier } from '@tet/domain/shared';
import { test } from 'tests/main.fixture';
import { PriorisationLeviersPom } from './priorisation-leviers.pom';

const LEVIER_COUNT = 29;
const MOBILISED_LEVIER_NOM: Levier = 'Vélo et transport en commun';

const mobilisationWithTwoFiches: LevierMobilisation[] = [
  {
    levierId: 'velo_transport_commun',
    volets: [
      { categorie: 'amenagement', note: 2, ficheIds: [1] },
      { categorie: 'financement', note: 0, ficheIds: [1, 2] },
    ],
  },
];

test.describe('Priorisation des leviers', () => {
  test("sans mobilisation, un membre voit les 29 leviers et l'absence d'actions rattachées", async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(priorisationLeviersPom.levierNames).toHaveCount(LEVIER_COUNT);
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeVisible();
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

  test('un membre voit le nombre de fiches distinctes rattachées au levier', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(
      priorisationLeviersPom.levierCard(MOBILISED_LEVIER_NOM)
    ).toContainText('2 actions déjà rattachées');
    await expect(
      priorisationLeviersPom.missingMobilisationMessage
    ).toBeHidden();
  });

  test('un utilisateur vérifié non membre voit le même nombre de fiches rattachées', async ({
    collectivites,
    mobilisations,
    page,
  }) => {
    const collectivite = await collectivites.addCollectivite({});
    await mobilisations.add({
      collectiviteId: collectivite.data.id,
      leviers: mobilisationWithTwoFiches,
    });
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const priorisationLeviersPom = new PriorisationLeviersPom(page);

    await priorisationLeviersPom.goto(collectivite.data.id);

    await expect(
      priorisationLeviersPom.levierCard(MOBILISED_LEVIER_NOM)
    ).toContainText('2 actions déjà rattachées');
  });
});
