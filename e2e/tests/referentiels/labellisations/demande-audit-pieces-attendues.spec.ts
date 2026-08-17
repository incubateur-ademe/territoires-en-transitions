import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Demande audit — pieces attendues', () => {
  test.beforeEach(async ({ collectivites, referentiels }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);
    await referentiels.updateAllReferentielStatutsToFait(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.seedRolePilotes(user, collectivite.data.id, referentiel);
  });

  test('Le seul dossier de candidature ne suffit pas quand un acte est aussi attendu', async ({
    auditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await auditLabellisationPom.uploadCandidatureDocument();
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.ajouterActeEngagementButton
    ).toBeVisible();
    await expect(auditLabellisationPom.demanderAuditButton).toBeDisabled();
  });

  test("Un document sans objet n'apparait pas et n'ouvre pas la demande", async ({
    page,
    auditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);
    await referentiels.seedLabellisationPreuve(
      user,
      collectivite.data.id,
      referentiel,
      null
    );

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(page.getByText('test-preuve.pdf')).toHaveCount(0);
    await expect(
      auditLabellisationPom.ajouterActeEngagementButton
    ).toBeVisible();
    await expect(auditLabellisationPom.demanderAuditButton).toBeDisabled();
  });

  test("Le seul acte d'engagement ne suffit pas quand un dossier est aussi attendu", async ({
    auditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await auditLabellisationPom.uploadActeEngagement();
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.acteEngagementRow.getByText('document_test.pdf')
    ).toBeVisible();
    await expect(
      auditLabellisationPom.ajouterDocumentCandidatureButton
    ).toBeVisible();
    await expect(auditLabellisationPom.demanderAuditButton).toBeDisabled();
  });

  test('Les deux pieces deposees ouvrent la demande', async ({
    auditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);
    await auditLabellisationPom.uploadCandidatureDocument();
    await auditLabellisationPom.uploadActeEngagement();
    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      auditLabellisationPom.acteEngagementRow.getByText('document_test.pdf')
    ).toBeVisible();
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();
  });
});
