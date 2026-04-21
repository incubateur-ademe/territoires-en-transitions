import { expect } from '@playwright/test';
import { testWithIndicateurs as test } from '../indicateurs.fixture';

test.describe("Détail d'un indicateur personnalisé", () => {
  let collectiviteId: number;
  let indicateurId: number;

  test.beforeEach(
    async ({ page, collectivites, indicateurs, indicateurDetailPom }) => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        {
          userArgs: { autoLogin: true },
        }
      );

      collectiviteId = collectivite.data.id;

      indicateurId = await indicateurs.create(user, {
        collectiviteId,
        titre: 'Indicateur favori test',
        unite: 'kg',
      });

      // Marquer comme favori via l'API
      await indicateurs.update(user, {
        indicateurId,
        collectiviteId,
        indicateurFields: {
          estFavori: true,
        },
      });

      await page.goto('/');
      await indicateurDetailPom.goto(collectiviteId, indicateurId);
    }
  );

  test('Modifier le pilote préserve le favori', async ({
    indicateurDetailPom,
    users,
  }) => {
    const user = users.getUser();
    // Vérifier que le favori est actif
    await indicateurDetailPom.expectIsFavori();

    // Ouvrir la modale d'édition et sélectionner un pilote
    await indicateurDetailPom.openEditModal();

    // Sélectionner le premier pilote disponible dans le dropdown
    await indicateurDetailPom.piloteDropdown.click();
    const userOption = indicateurDetailPom.page.getByTestId(user.data.id);
    await expect(userOption).toBeVisible();
    await userOption.click();

    // Sauvegarder
    await indicateurDetailPom.saveEditModal();

    // Recharger la page pour vérifier la persistance
    await indicateurDetailPom.goto(collectiviteId, indicateurId);

    // Le favori doit toujours être actif
    await indicateurDetailPom.expectIsFavori();
  });
});
