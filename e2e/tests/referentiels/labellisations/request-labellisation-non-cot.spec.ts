import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Request labellisation collectivité non COT', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    page.goto('/');
  });

  test('Request labellisation 1ère étoile CAE pas possible si référentiel non rempli', async ({
    labellisationPom,
    users,
    referentiels,
    collectivites,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    await referentiels.updateActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.2.0.1',
      avancement: 'fait',
      concerne: true,
    });

    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.requestFirstStarButton).toBeDisabled();
    await expect(labellisationPom.requestAuditButton).toHaveCount(0);
    await expect(labellisationPom.updateActionStatutsLink).toBeVisible();
  });

  test('Request labellisation 1ère étoile CAE pas possible si référentiel rempli mais critères de score non atteints', async ({
    labellisationPom,
    users,
    referentiels,
    collectivites,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );

    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.requestFirstStarButton).toBeDisabled();
    await expect(labellisationPom.requestAuditButton).toHaveCount(0);
    // Button to update action statuts is not present
    await expect(labellisationPom.updateActionStatutsLink).toHaveCount(0);
  });

  test('Request labellisation 1ère étoile CAE pas possible si référentiel rempli, critères de score atteints mais fichier de labellisation manquant', async ({
    labellisationPom,
    users,
    referentiels,
    collectivites,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectivite.data.id,
      referentiel
    );
    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.requestFirstStarButton).toBeDisabled();
    await expect(labellisationPom.requestAuditButton).toHaveCount(0);
    // Button to update action statuts is not present
    await expect(labellisationPom.updateActionStatutsLink).toHaveCount(0);

    await labellisationPom.setTestDocument();

    await expect(labellisationPom.requestFirstStarButton).toBeEnabled();
    await labellisationPom.requestFirstStarButton.click();
    await labellisationPom.submitRequestLabellisationButton.click();

    await expect(
      labellisationPom.requestLabellisationSuccessMessage
    ).toBeVisible();
    await labellisationPom.closeDemandeAuditModalButton.click();
    await expect(
      labellisationPom.demandeLabellisationEnCoursMessage
    ).toBeVisible();
  });
});
