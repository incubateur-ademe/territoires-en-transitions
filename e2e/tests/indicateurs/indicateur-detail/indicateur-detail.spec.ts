import { expect } from '@playwright/test';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { test } from 'tests/main.fixture';

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

for (const { label, periodicite } of [
  { label: 'Annuelle', periodicite: IndicateurPeriodiciteEnum.ANNUELLE },
  {
    label: 'Semestrielle',
    periodicite: IndicateurPeriodiciteEnum.SEMESTRIELLE,
  },
  {
    label: 'Trimestrielle',
    periodicite: IndicateurPeriodiciteEnum.TRIMESTRIELLE,
  },
  { label: 'Mensuelle', periodicite: IndicateurPeriodiciteEnum.MENSUELLE },
]) {
  test(`Conserver la périodicité ${label.toLowerCase()} de création pour la saisie et l’affichage`, async ({
    page,
    collectivites,
    fiches,
    indicateurs,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    const [ficheId] = await fiches.create(user, [
      {
        collectiviteId,
        titre: 'Suivi des périodes',
        statut: 'En cours',
      },
    ]);
    await page.goto(
      `/collectivite/${collectiviteId}/actions/${ficheId}/indicateurs`
    );
    await page
      .getByRole('button', { name: /Créer un indicateur$/ })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Créer un indicateur',
      exact: true,
    });
    await dialog
      .getByLabel("Nom de l'indicateur", { exact: true })
      .fill(`Suivi ${label}`);
    await dialog.getByLabel('Unité', { exact: true }).fill('kg');
    const periodiciteSelect = dialog
      .getByRole('button', { name: 'ouvrir le menu' })
      .filter({ hasText: 'Annuelle' });
    await expect(periodiciteSelect).toBeVisible();
    if (label !== 'Annuelle') {
      await periodiciteSelect.click();
      await page.getByRole('button', { name: label, exact: true }).click();
    }
    const popupPromise = page.waitForEvent('popup');
    await dialog.getByRole('button', { name: 'Valider', exact: true }).click();
    const detailPage = await popupPromise;
    await expect(detailPage).toHaveURL(/\/indicateurs\/perso\/\d+/);
    await expect(detailPage.getByText(label, { exact: true })).toBeVisible();
    await detailPage.reload();
    await expect(detailPage.getByText(label, { exact: true })).toBeVisible();
    await detailPage.getByTestId('indicateurs.periodicite.badge').focus();
    await expect(detailPage.getByRole('tooltip')).toContainText(
      'Elle est fixée à sa création et ne peut pas être modifiée.'
    );

    const indicateurId = Number(
      new URL(detailPage.url()).pathname.split('/').pop()
    );
    const expectFixedPeriodicite = async () => {
      await expect(detailPage.getByText(label, { exact: true })).toBeVisible();
      await expect(detailPage.getByRole('radio')).toHaveCount(0);
      await expect(
        detailPage.getByRole('button', { name: label, exact: true })
      ).toHaveCount(0);
      await expect(
        detailPage
          .getByRole('button', { name: 'ouvrir le menu' })
          .filter({ hasText: label })
      ).toHaveCount(0);
    };
    await expectFixedPeriodicite();
    await user.getTrpcClient().indicateurs.valeurs.upsert.mutate({
      collectiviteId,
      indicateurId,
      periodicite,
      dateValeur: '2026-01-01',
      resultat: 0,
    });
    await detailPage.reload();
    await expectFixedPeriodicite();
    await detailPage.close();
    await indicateurs.delete(user, indicateurId, collectiviteId);
  });
}

test('Expliquer au clavier le suivi annuel d’un indicateur du score TETE', async ({
  page,
  collectivites,
  indicateurs,
  indicateurDetailPom,
}) => {
  const { collectivite, user } = await collectivites.addCollectiviteAndUser({
    userArgs: { autoLogin: true },
  });
  const collectiviteId = collectivite.data.id;
  const indicateurId = await indicateurs.create(user, {
    collectiviteId,
    titre: 'Indicateur annuel du score',
    unite: '%',
    periodicite: 'annuelle',
  });
  await indicateurs.setParticipationScore(indicateurId);
  await indicateurDetailPom.goto(collectiviteId, indicateurId);
  const badge = page.getByTestId('indicateurs.periodicite.badge');
  await expect(badge).toContainText('Annuelle');
  await badge.focus();
  await expect(page.getByRole('tooltip')).toContainText(
    'il participe au score du programme TETE'
  );
});
