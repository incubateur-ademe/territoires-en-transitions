import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

test.describe('Documents de candidature — accès auditeur', () => {
  test("l'auditeur voit la section mais pas le bouton « Ajouter un document »", async ({
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
    await referentiels.seedRolePilotes(
      editeurUser,
      collectiviteId,
      referentiel
    );
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

    await auditeurUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(auditLabellisationPom.candidatureDocumentsTitle).toBeVisible();
    await expect(
      auditLabellisationPom.ajouterDocumentCandidatureButton
    ).toHaveCount(0);
  });
});
