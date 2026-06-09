import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe("Onglets de conduite d'audit (Suivi / Cycles)", () => {
  test("audit en cours : visibles pour l'auditeur, masqués pour la collectivité et un non-membre", async ({
    page,
    collectivites,
    referentiels,
    users,
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

    const suiviTab = page.getByRole('tab', { name: "Suivi de l'audit" });
    const cyclesTab = page.getByRole('tab', { name: 'Cycles et comparaison' });

    await auditeurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(suiviTab).toBeVisible();
    await expect(cyclesTab).toBeVisible();

    await editeurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      page.getByRole('tab', { name: /Audit et labellisation/ })
    ).toBeVisible({ timeout: 15_000 });
    await expect(suiviTab).toHaveCount(0);
    await expect(cyclesTab).toHaveCount(0);

    const nonMembreUser = await users.addUser();
    await nonMembreUser.login();
    await page.goto(
      `/collectivite/${collectiviteId}/referentiel/new/${referentiel}/audit-labellisation`
    );
    await expect(
      page.getByRole('tab', { name: /Audit et labellisation/ })
    ).toBeVisible({ timeout: 15_000 });
    await expect(suiviTab).toHaveCount(0);
    await expect(cyclesTab).toHaveCount(0);
  });
});
