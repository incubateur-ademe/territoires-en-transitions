import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe("Conduite d'audit (onglet Cycles et bandeau vue tableau)", () => {
  test("audit en cours : onglet Suivi retire, Cycles et bandeau visibles pour l'auditeur, masques pour l'admin et le visiteur", async ({
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
    const visiteurUser = await (collectivite as CollectiviteFixture).addUser({
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
    const tableHintBanner = page.getByText(
      "Retrouvez le suivi de l'audit dans la vue tabulaire"
    );

    await auditeurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(suiviTab).toHaveCount(0);
    await expect(cyclesTab).toBeVisible();
    await expect(tableHintBanner).toBeVisible();

    await editeurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      page.getByRole('tab', { name: /Audit et labellisation/ })
    ).toBeVisible({ timeout: 15_000 });
    await expect(suiviTab).toHaveCount(0);
    await expect(cyclesTab).toHaveCount(0);
    await expect(tableHintBanner).toHaveCount(0);

    await visiteurUser.login();
    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      page.getByRole('tab', { name: /Audit et labellisation/ })
    ).toBeVisible({ timeout: 15_000 });
    await expect(suiviTab).toHaveCount(0);
    await expect(cyclesTab).toHaveCount(0);
    await expect(tableHintBanner).toHaveCount(0);
  });
});
