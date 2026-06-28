import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { UpdateUserPom } from './update-user.pom';

test.describe('Modification du profil utilisateur', () => {
  test('Modifier les informations du profil et vérifier la mise à jour', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const pom = new UpdateUserPom(page);

    // Naviguer vers la page profil
    await pom.goto();

    // Récupérer les valeurs initiales
    const initialPrenom = user.data.prenom;
    const initialNom = user.data.nom;
    const initialTelephone = user.data.telephone;

    // Vérifier les valeurs initiales affichées
    await pom.expectPrenomNom(`${initialPrenom} ${initialNom}`);
    await pom.expectEmail(user.data.email);
    await pom.expectTelephone(initialTelephone);

    // Ouvrir la modale d'édition
    await pom.openEditModal();

    // Modifier les informations
    const newPrenom = 'Jean';
    const newNom = 'Dupont';
    const newTelephone = '06 12 34 56 78';

    await pom.fillForm({
      prenom: newPrenom,
      nom: newNom,
      telephone: newTelephone,
    });

    // Soumettre le formulaire
    await pom.submitForm();

    // Vérifier que les données sont mises à jour sur la page
    await pom.expectPrenomNom(`${newPrenom} ${newNom}`);
    await pom.expectTelephone(newTelephone);
    // L'email ne devrait pas changer car on ne modifie que prenom, nom et telephone
    await pom.expectEmail(user.data.email);

    // Vérifier via tRPC que les données sont bien mises à jour en base
    const trpcClient = user.getTrpcClient();
    const updatedUser = await trpcClient.users.users.get.query();

    expect(updatedUser.prenom).toBe(newPrenom);
    expect(updatedUser.nom).toBe(newNom);
    expect(updatedUser.telephone).toBe(newTelephone);
    expect(updatedUser.email).toBe(user.data.email);
  });
});
