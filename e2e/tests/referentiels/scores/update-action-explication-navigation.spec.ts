import { expect } from '@playwright/test';
import { testWithReferentiels as test } from '../referentiels.fixture';

const MESURE_111_ID = 'cae_1.1.1';
const MESURE_111_HEADING = '1.1.1 Définir la vision, les';

test.describe('Explication mesure — cache après navigation', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, 'cae');
    await page.goto('/');
  });

  test("L'explication modifiée reste visible après mesure suivante puis mesure précédente", async ({
    page,
    referentielScoresPom,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const explicationText = `explication-nav-e2e-${Date.now()}`;

    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(
      '1 - Planification',
      '1.1 Stratégie globale',
      MESURE_111_HEADING
    );

    await expect(
      page.getByText("Explications sur l'état d'avancement")
    ).toBeVisible();
    await referentielScoresPom.expectActionExplicationEditorVisible(
      MESURE_111_ID
    );

    const nextLink = referentielScoresPom.getMesureSuivanteLink();
    await expect(nextLink).toBeVisible();
    await expect(nextLink).toHaveAttribute('href', /\/action\/cae_1\.1\./);

    await referentielScoresPom.fillActionExplication(
      MESURE_111_ID,
      explicationText
    );

    const saveDone = referentielScoresPom.waitForUpdateCommentaireResponse();
    await nextLink.click();
    await saveDone;

    await expect(page).not.toHaveURL(/\/action\/cae_1\.1\.1(?:[/?#]|$)/);
    await expect(referentielScoresPom.getMesurePrecedenteLink()).toBeVisible();

    await referentielScoresPom.getMesurePrecedenteLink().click();
    await expect(
      referentielScoresPom.getActionHeader(MESURE_111_HEADING)
    ).toBeVisible();

    await expect(
      referentielScoresPom.getActionExplicationLocator(MESURE_111_ID)
    ).toContainText(explicationText);
  });
});
