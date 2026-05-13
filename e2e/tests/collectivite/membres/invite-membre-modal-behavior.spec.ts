import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import { InviteMembrePom } from './invite-membre.pom';

/**
 * Tests anti-régression centrés sur les comportements de la modale "Inviter un
 * membre" (Modal contrôlée via `openState`) : ouverture, fermeture par les
 * différents canaux (bouton X, ESC, Annuler) et démontage de l'état du
 * formulaire à la fermeture. Le happy path d'invitation est couvert par
 * invite-membre.spec.ts.
 */
test.describe('Modale d’invitation d’un membre — comportements', () => {
  test('Le bouton X ferme la modale', async ({ collectivites, page }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.openInviteModal();

    await pom.closeViaXButton();
  });

  test('La touche ESC ferme la modale', async ({ collectivites, page }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.openInviteModal();

    await pom.closeViaEscape();
  });

  test('Le bouton Annuler ferme la modale', async ({ collectivites, page }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);
    await pom.openInviteModal();

    await pom.closeViaCancelButton();
  });

  test('Réouvrir la modale après une saisie partielle présente un formulaire vide', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);

    await pom.openInviteModal();
    await pom.emailInput.fill('saisie-partielle@test-e2e.fr');
    await pom.closeViaCancelButton();

    await pom.openInviteModal();
    await pom.expectEmailInputValue('');
  });

  test('Réouvrir après une fermeture par ESC présente un formulaire vide', async ({
    collectivites,
    page,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true, role: CollectiviteRole.ADMIN },
    });

    const pom = new InviteMembrePom(page);
    await pom.gotoUsersPage(collectivite.data.id);

    await pom.openInviteModal();
    await pom.emailInput.fill('saisie-esc@test-e2e.fr');
    await pom.closeViaEscape();

    await pom.openInviteModal();
    await pom.expectEmailInputValue('');
  });
});
