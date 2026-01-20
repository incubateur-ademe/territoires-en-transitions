import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

test.describe('Request labellisation audit collectivité COT', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    page.goto('/');
  });

  test('Demande de labellisation 1ère étoile et audit CAE impossible si référentiel non rempli', async ({
    labellisationPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // We have to keep this variable order to clean data
  }) => {
    await labellisationPom.goto('cae');
    await expect(labellisationPom.requestFirstStarButton).toBeDisabled();
    await expect(labellisationPom.requestAuditButton).toBeDisabled();
    await expect(labellisationPom.updateActionStatutsLink).toBeVisible();
  });

  test('Possibilité de demander un audit si le référentiel est complètement rempli', async ({
    labellisationPom,
    users,
    referentiels,
    collectivites,
  }) => {
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    const referentiel: ReferentielId = 'cae';
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );
    await labellisationPom.goto(referentiel);
    await expect(labellisationPom.requestFirstStarButton).toBeDisabled();
    await expect(labellisationPom.requestAuditButton).toBeEnabled();
    await expect(labellisationPom.updateActionStatutsLink).toHaveCount(0);
    await labellisationPom.requestAuditButton.click();
    await expect(labellisationPom.demandeAuditModal).toBeVisible();
    await expect(labellisationPom.auditTypeText).toBeVisible();
    await expect(
      labellisationPom.auditTypeCotWithLabellisationRadio
    ).toBeDisabled();
    await expect(labellisationPom.auditTypeLabellisationRadio).toBeDisabled();
    await expect(
      labellisationPom.auditTypeCotWithoutLabellisationRadio
    ).toBeEnabled();
    await labellisationPom.auditTypeCotWithoutLabellisationRadio.click();

    await labellisationPom.submitRequestLabellisationButton.click();

    await expect(
      labellisationPom.requestLabellisationAuditOnlySuccessMessage
    ).toBeVisible();
    await labellisationPom.closeDemandeAuditModalButton.click();
    await expect(
      labellisationPom.demandeLabellisationEnCoursMessage
    ).toBeVisible();
  });
});
