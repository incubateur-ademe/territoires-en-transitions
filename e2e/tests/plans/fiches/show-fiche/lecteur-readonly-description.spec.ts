import { expect } from '@playwright/test';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';

const test = testWithFiches;

test.describe('Lecteur ne peut pas modifier description et objectifs', () => {
  test('les champs description et objectifs sont en lecture seule pour un lecteur', async ({
    page,
    collectivites,
    fiches,
  }) => {
    // Crée une collectivité avec un admin (autoLogin pour avoir accès au trpcClient)
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: {
          role: 'admin',
          autoLogin: true,
        },
      });

    // Crée une fiche avec du contenu dans description et objectifs
    const createdFicheIds = await fiches.create(adminUser, [
      {
        titre: 'Fiche test lecteur readonly',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const ficheId = createdFicheIds[0];

    // Ajoute du contenu à la fiche (description et objectifs)
    const trpcClient = adminUser.getTrpcClient();
    await trpcClient.plans.fiches.update.mutate({
      ficheId,
      ficheFields: {
        description: '<p>Description de test</p>',
        objectifs: '<p>Objectifs de test</p>',
      },
    });

    // Crée un utilisateur lecteur
    const lecteurUser = await collectivite.addUser({
      role: 'lecture',
    });

    // Se connecte en tant que lecteur
    await lecteurUser.login();

    // Navigue vers la fiche action
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/details`
    );

    // Attend que la page soit chargée avec le contenu
    await expect(page.getByText('Description de test')).toBeVisible();
    await expect(page.getByText('Objectifs de test')).toBeVisible();

    // Vérifie que les éditeurs de description et objectifs ne sont pas éditables
    // BlockNote utilise l'attribut contenteditable sur le div.bn-editor
    const editors = page.locator('.bn-editor');
    const editorCount = await editors.count();

    // Il devrait y avoir au moins 2 éditeurs (description + objectifs)
    expect(editorCount).toBeGreaterThanOrEqual(2);

    // Vérifie que tous les éditeurs sont en mode lecture seule
    for (let i = 0; i < editorCount; i++) {
      await expect(editors.nth(i)).toHaveAttribute(
        'contenteditable',
        'false'
      );
    }
  });
});
