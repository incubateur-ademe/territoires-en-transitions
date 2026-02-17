import { expect } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from '../../collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Create and update document', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await page.goto('/');
  });

  test("Éditeur peut modifier le nom d'un document de preuve", async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expandSousAction('1.1.1.3');
    await referentielScoresPom.documentsExpandButton.click();

    await expect(
      referentielScoresPom.getPreuveReglementaireButtonLocator('agenda21')
    ).toBeVisible();

    await expect(
      referentielScoresPom.documentsAddPreuveComplementaireButton
    ).toBeVisible();

    await referentielScoresPom
      .getPreuveReglementaireButtonLocator('agenda21')
      .click();

    await referentielScoresPom.documentsPom.setTestDocument();

    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();
    await expect(
      referentielScoresPom.documentsPom.documentCardConfidentielIcon
    ).toHaveCount(0);
    await referentielScoresPom.documentsPom.documentCard.hover();
    await referentielScoresPom.documentsPom.editButton.click();
    await expect(
      referentielScoresPom.documentsPom.editModalTitle
    ).toBeVisible();
    await referentielScoresPom.documentsPom.editModalNameInput.fill(
      'Document renommé'
    );
    await referentielScoresPom.documentsPom.editModalPrivateCheckbox.check();
    await referentielScoresPom.documentsPom.editModalSaveButton.click();
    await expect(referentielScoresPom.documentsPom.documentCard).toContainText(
      'Document renommé'
    );
    await expect(
      referentielScoresPom.documentsPom.documentCardConfidentielIcon
    ).toBeVisible();
    await referentielScoresPom.documentsPom.documentCard.hover();
    await referentielScoresPom.documentsPom.deleteButton.click();

    await expect(
      referentielScoresPom.documentsPom.deleteButtonConfirmationModalTitle
    ).toBeVisible();
    await referentielScoresPom.documentsPom.deleteButtonConfirmationModalButtonOk.click();
    await expect(referentielScoresPom.documentsPom.documentCard).toHaveCount(0);
  });

  test('Lecteur ne peut pas mettre à jour un document', async ({
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
    collectivites,
    page,
  }) => {
    const collectivite: CollectiviteFixture = collectivites.getCollectivite();

    await page.reload();
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      '1.1.1 Définir la vision, les'
    );

    await referentielScoresPom.expandSousAction('1.1.1.3');
    await referentielScoresPom.documentsExpandButton.click();

    await referentielScoresPom
      .getPreuveReglementaireButtonLocator('agenda21')
      .click();

    await referentielScoresPom.documentsPom.setTestDocument();

    // Now change to lecture user
    await collectivite.setUserCollectiviteRole(CollectiviteRole.LECTURE);
    await page.reload();
    await referentielScoresPom.expandSousAction('1.1.1.3');
    await referentielScoresPom.documentsExpandButton.click();

    await expect(
      referentielScoresPom.getPreuveReglementaireButtonLocator('agenda21')
    ).toHaveCount(0);

    await expect(
      referentielScoresPom.documentsAddPreuveComplementaireButton
    ).toHaveCount(0);

    await expect(referentielScoresPom.documentsPom.documentCard).toBeVisible();
    await referentielScoresPom.documentsPom.documentCard.hover();

    await expect(referentielScoresPom.documentsPom.editButton).toHaveCount(0);
    await expect(referentielScoresPom.documentsPom.deleteButton).toHaveCount(0);
  });
});
