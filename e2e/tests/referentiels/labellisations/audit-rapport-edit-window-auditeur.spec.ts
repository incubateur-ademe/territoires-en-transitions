import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe("Rapport d'audit dans la bibliothèque", () => {
  test("l'auditeur peut modifier le rapport après clôture (fenêtre 15 j), pas la collectivité", async ({
    page,
    collectivites,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    const collectiviteId = collectivite.data.id;
    await editeurUser.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.seedLabellisationObtenue({
      collectiviteId,
      referentielId: referentiel,
      etoiles: 1,
    });
    await referentiels.updateAllReferentielStatutsToFait(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      editeurUser,
      collectiviteId,
      referentiel
    );
    const auditeurUser = await (collectivite as CollectiviteFixture).addUser({
      role: CollectiviteRole.LECTURE,
      autoLogin: true,
    });
    await referentiels.requestLabellisationAudit(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.addAuditeur({
      user: auditeurUser,
      collectiviteId,
      referentielId: referentiel,
    });
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);

    await auditeurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await newAuditLabellisationPom.closeAuditWithReport();

    const rapportEditButtons = page
      .locator('[data-test="labellisation"]')
      .locator('[data-test="btn-edit"]');

    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(rapportEditButtons).toHaveCount(1);

    await editeurUser.login();
    await page.goto(`/collectivite/${collectiviteId}/bibliotheque`);
    await expect(page.getByText('document_test.pdf').first()).toBeVisible();
    await expect(rapportEditButtons).toHaveCount(0);
  });
});
