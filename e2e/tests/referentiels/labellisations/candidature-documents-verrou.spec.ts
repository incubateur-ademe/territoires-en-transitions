import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Documents de candidature — verrou apres validation', () => {
  test("une fois l'audit valide, l'editeur voit ses documents mais ne peut plus les modifier", async ({
    page,
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
        collectiviteArgs: { isCOT: true },
      });
    const collectiviteId = collectivite.data.id;
    await editeurUser.precomputeReferentielSnapshot(
      collectiviteId,
      referentiel
    );
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
      referentiel,
      ObjetPreuveEnum.CANDIDATURE
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
    await referentiels.validateAudit(collectiviteId, referentiel);

    await editeurUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(
      auditLabellisationPom.candidatureDocumentsTitle
    ).toBeVisible();
    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();

    await expect(auditLabellisationPom.ajouterDocumentCandidatureButton).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Renommer le fichier' })
    ).toHaveCount(0);
  });
});
