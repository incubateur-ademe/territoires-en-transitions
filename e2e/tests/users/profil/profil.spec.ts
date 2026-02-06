import { expect } from '@playwright/test';
import { test } from 'tests/main.fixture';
import { ProfilPom } from './profil.pom';

test.describe('Modification du profil utilisateur', () => {
  test('Modifier les informations du profil et vérifier la mise à jour', async ({
    collectivites,
    page,
  }) => {
    const { user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const profilPom = new ProfilPom(page);

    // Naviguer vers la page profil
    await profilPom.goto();

    // Récupérer les valeurs initiales
    const initialPrenom = user.data.prenom;
    const initialNom = user.data.nom;
    const initialTelephone = user.data.telephone;

    // Vérifier les valeurs initiales affichées
    await profilPom.expectPrenomNom(`${initialPrenom} ${initialNom}`);
    await profilPom.expectEmail(user.data.email);
    await profilPom.expectTelephone(initialTelephone);

    // Ouvrir la modale d'édition
    await profilPom.openEditModal();

    // Modifier les informations
    const newPrenom = 'Jean';
    const newNom = 'Dupont';
    const newTelephone = '0612345678';

    await profilPom.fillForm({
      prenom: newPrenom,
      nom: newNom,
      telephone: newTelephone,
    });

    // Soumettre le formulaire
    await profilPom.submitForm();

    // Vérifier que les données sont mises à jour sur la page
    await profilPom.expectPrenomNom(`${newPrenom} ${newNom}`);
    await profilPom.expectTelephone(newTelephone);
    // L'email ne devrait pas changer car on ne modifie que prenom, nom et telephone
    await profilPom.expectEmail(user.data.email);

    // Vérifier via tRPC que les données sont bien mises à jour en base
    const trpcClient = user.getTrpcClient();
    const updatedUser = await trpcClient.users.getDetails.query();

    expect(updatedUser.user.prenom).toBe(newPrenom);
    expect(updatedUser.user.nom).toBe(newNom);
    expect(updatedUser.user.telephone).toBe(newTelephone);
    expect(updatedUser.user.email).toBe(user.data.email);
  });
});
