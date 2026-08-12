import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe("Checklist audit-labellisation — acte d'engagement et documents de candidature", () => {
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
  });

  test('Sans étoile obtenue mais éligible à la labellisation, les deux sections sont affichées', async ({
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      newAuditLabellisationPom.televerserActeSigneButton
    ).toBeVisible();
    await expect(
      newAuditLabellisationPom.candidatureDocumentsTitle
    ).toBeVisible();
  });

  test("Une preuve sans objet n'apparait dans aucune section", async ({
    page,
    newAuditLabellisationPom,
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

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(
      newAuditLabellisationPom.candidatureDocumentsTitle
    ).toBeVisible();
    await expect(page.getByText('test-preuve.pdf')).toHaveCount(0);
    await expect(
      newAuditLabellisationPom.televerserActeSigneButton
    ).toBeVisible();
  });

  test("Ajouter un document de candidature ne vaut pas dépôt de l'acte d'engagement", async ({
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);
    await newAuditLabellisationPom.uploadCandidatureDocument();

    await expect(
      newAuditLabellisationPom.televerserActeSigneButton
    ).toBeVisible();
    await expect(
      newAuditLabellisationPom.acteEngagementRow.getByText('document_test.pdf')
    ).toHaveCount(0);
  });

  test("Deposer l'acte d'engagement ne l'affiche pas parmi les documents de candidature", async ({
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);
    await newAuditLabellisationPom.uploadActeEngagement();

    await expect(
      newAuditLabellisationPom.acteEngagementRow.getByText('document_test.pdf')
    ).toBeVisible();
    await expect(
      newAuditLabellisationPom.candidatureDocumentsRow
    ).toBeVisible();
    await expect(
      newAuditLabellisationPom.candidatureDocumentsRow.getByText(
        'document_test.pdf'
      )
    ).toHaveCount(0);
  });
});
