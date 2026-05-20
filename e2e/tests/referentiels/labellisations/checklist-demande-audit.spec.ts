import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe("Checklist audit-labellisation — demande d'audit", () => {
  test("Collectivité COT : l'envoi d'une demande d'audit COT ferme la modale", async ({
    collectivites,
    users,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    const user = await users.getUser();
    const collectivite = collectivites.getCollectivite();
    // Un audit COT exige un référentiel complet (`completude_ok`) ; on
    // renseigne juste les statuts nécessaires plutôt que tout passer à Fait.
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );

    await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);
    await newAuditLabellisationPom.openAuditModal();

    await newAuditLabellisationPom.auditTypeGroup
      .getByRole('radio', { name: 'Audit COT sans labellisation' })
      .click();
    await newAuditLabellisationPom.envoyerAuditButton.click();

    await expect(newAuditLabellisationPom.auditSuccessToast).toBeVisible();
    await expect(newAuditLabellisationPom.auditModal).toHaveCount(0);
  });
});
