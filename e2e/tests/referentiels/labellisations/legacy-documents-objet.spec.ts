import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Ancien ecran de labellisation — documents sans objet', () => {
  test("un document depose depuis l'ancien ecran n'apparait pas sur la checklist", async ({
    page,
    labellisationPom,
    newAuditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectiviteId,
      referentiel
    );

    await page.goto('/');
    await labellisationPom.goto(referentiel);
    await labellisationPom.setLabellisationRequestTestDocument();

    await expect(page.getByText('document_test.pdf').first()).toBeVisible();

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(page.getByText('document_test.pdf')).toHaveCount(0);
    await expect(
      newAuditLabellisationPom.ajouterActeEngagementButton
    ).toBeVisible();
  });

  test('plusieurs documents deposes sans objet restent tous invisibles sur la checklist', async ({
    page,
    labellisationPom,
    newAuditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      user,
      collectiviteId,
      referentiel
    );

    await page.goto('/');
    await labellisationPom.goto(referentiel);
    await labellisationPom.setLabellisationRequestTestDocument();
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(page.getByText('test-preuve.pdf')).toHaveCount(0);
    await expect(page.getByText('document_test.pdf')).toHaveCount(0);
    await expect(
      newAuditLabellisationPom.ajouterActeEngagementButton
    ).toBeVisible();
  });

  test("l'ancien ecran liste les documents quel que soit leur objet", async ({
    page,
    labellisationPom,
    newAuditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.seedLabellisationObtenue({
      collectiviteId,
      referentielId: referentiel,
      etoiles: 1,
    });
    await referentiels.updateAllReferentielStatutsToFait(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      user,
      collectiviteId,
      referentiel
    );

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await newAuditLabellisationPom.uploadCandidatureDocument();
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();

    await page.goto('/');
    await labellisationPom.goto(referentiel);

    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
  });
});
