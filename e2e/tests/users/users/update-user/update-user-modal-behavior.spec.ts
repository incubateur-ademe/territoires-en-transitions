import { test } from 'tests/main.fixture';
import { UpdateUserPom } from './update-user.pom';

/**
 * Tests anti-régression centrés sur les comportements complexes de la modale
 * "Modifier mes informations" : validation du formulaire qui gate le bouton
 * Valider, et réinitialisation de l'état du formulaire à la fermeture (via
 * Annuler, bouton X, ESC) — comportements indépendants du happy path de mise
 * à jour déjà couvert par update-user.spec.ts.
 */
test.describe('Modale de modification du profil — comportements', () => {
  test('Annuler ferme la modale et restaure les valeurs initiales à la réouverture', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);
    await pom.goto();
    await pom.openEditModal();

    await pom.fillForm({ prenom: 'PrenomModifie', nom: 'NomModifie' });
    await pom.closeEditModal();

    await pom.openEditModal();
    await pom.expectInputValue('prenom', user.data.prenom);
    await pom.expectInputValue('nom', user.data.nom);
  });

  test('Bouton X ferme la modale et restaure les valeurs initiales à la réouverture', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);
    await pom.goto();
    await pom.openEditModal();

    await pom.fillForm({ telephone: '06 99 99 99 99' });
    await pom.closeEditModalViaXButton();

    await pom.openEditModal();
    await pom.expectInputValue('telephone', user.data.telephone ?? '');
  });

  test('ESC ferme la modale et restaure les valeurs initiales à la réouverture', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);
    await pom.goto();
    await pom.openEditModal();

    await pom.fillForm({ prenom: 'AvantEsc' });
    await pom.closeEditModalViaEscape();

    await pom.openEditModal();
    await pom.expectInputValue('prenom', user.data.prenom);
  });

  test('Le bouton Valider est désactivé tant que le formulaire est invalide', async ({
    collectivites,
    page,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);
    await pom.goto();
    await pom.openEditModal();

    // Vider le champ nom (min 2 lettres requises) doit invalider le formulaire.
    await pom.fillForm({ nom: '' });
    await pom.expectSubmitDisabled();

    // Restaurer une valeur valide doit réactiver le bouton.
    await pom.fillForm({ nom: 'Dupont' });
    await pom.expectSubmitEnabled();
  });

  test('Annuler restaure aussi les champs email et téléphone', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);
    await pom.goto();

    await pom.openEditModal();
    await pom.fillForm({
      telephone: '06 00 00 00 00',
    });
    await pom.closeEditModal();

    await pom.openEditModal();
    await pom.expectInputValue('telephone', user.data.telephone ?? '');
    await pom.expectInputValue('email', user.data.email);
  });
});
