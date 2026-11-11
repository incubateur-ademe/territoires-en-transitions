import { expect } from '@playwright/test';
import { testWithTrajectoiresSnbc3 as test } from './trajectoire-snbc3.fixture';
import { TrajectoireSnbc3Pom } from './trajectoire-snbc3.pom';

/** Index du secteur « Déchets » dans le sélecteur des émissions GES (0 = tous). */
const SECTEUR_DECHETS_IDX = 6;

const ANNEES = [2021, 2030, 2050];
const valeursSecteurs = (identifiants: string[]) =>
  identifiants.flatMap((identifiant, i) =>
    ANNEES.map((annee, j) => ({
      identifiant,
      annee,
      objectif: (i + 1) * 100 - j * 20,
    }))
  );

// En CI, le flag `is-trajectoire-snbc3-enabled` est toujours actif : la page
// testée est la nouvelle page SNBC 3.
test.describe('Trajectoire SNBC 3', () => {
  test('un EPCI présent dans le millésime voit sa trajectoire, sans calcul ni saisie', async ({
    collectivites,
    trajectoiresSnbc3,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      collectiviteArgs: { type: 'epci', natureInsee: 'CA' },
      userArgs: { autoLogin: true },
    });
    // Déchets (`cae_1.h`) volontairement absent
    await trajectoiresSnbc3.addValeurs(
      collectivite.data.id,
      valeursSecteurs(['cae_1.c', 'cae_1.d', 'cae_1.i', 'cae_1.ih', 'cae_1.k'])
    );
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(collectivite.data.id);

    await expect(pom.title).toBeVisible();
    await expect(pom.recalculerButton).toHaveCount(0);
    await expect(pom.completerDonneesButton).toHaveCount(0);

    // « Ce qui change » depuis le lien sous le titre
    await pom.lienChangements.click();
    await expect(pom.changementsModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pom.changementsModal).toHaveCount(0);

    // le bandeau, une fois fermé, ne revient pas
    await expect(pom.bandeau).toBeVisible();
    await pom.fermerBandeauButton.click();
    await expect(pom.bandeau).toHaveCount(0);
    await page.reload();
    await expect(pom.title).toBeVisible();
    await expect(pom.bandeau).toHaveCount(0);

    // un secteur sans valeur : « Données non disponibles », sans bouton
    await pom.goto(collectivite.data.id, SECTEUR_DECHETS_IDX);
    await expect(pom.secteurNonDisponible).toBeVisible();
    await expect(pom.secteurNonDisponible.getByRole('button')).toHaveCount(0);
  });

  test('une commune est renvoyée vers la trajectoire de son EPCI', async ({
    collectivites,
    trajectoiresSnbc3,
    page,
  }) => {
    const epci = await collectivites.addCollectivite({
      type: 'epci',
      natureInsee: 'CA',
    });
    const { collectivite: commune } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { type: 'commune' },
        userArgs: { autoLogin: true },
      });
    await trajectoiresSnbc3.addEpciParent(commune.data.id, epci.data.id);
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(commune.data.id);

    await expect(pom.communeCard).toBeVisible();
    await expect(pom.consulterRattachementText).toBeVisible();
    await expect(pom.recalculerButton).toHaveCount(0);
    await pom.voirRattachementButton.click();
    await expect(page).toHaveURL(
      new RegExp(`/collectivite/${epci.data.id}/trajectoire$`)
    );
  });

  test("une commune sans EPCI parent n'est renvoyée vers aucune trajectoire", async ({
    collectivites,
    page,
  }) => {
    const { collectivite: commune } =
      await collectivites.addCollectiviteAndUser({
        collectiviteArgs: { type: 'commune' },
        userArgs: { autoLogin: true },
      });
    const pom = new TrajectoireSnbc3Pom(page);

    await pom.goto(commune.data.id);

    await expect(pom.communeCard).toBeVisible();
    await expect(pom.consulterRattachementText).toHaveCount(0);
    await expect(pom.voirRattachementButton).toHaveCount(0);
  });
});
