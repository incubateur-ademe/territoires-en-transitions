import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: ReferentielId = 'eci';

test.describe("Acte d'engagement — accès auditeur", () => {
  test("l'auditeur voit l'acte déposé mais ne peut ni le modifier ni en téléverser un autre", async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user: editeurUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const collectiviteId = collectivite.data.id;
    await editeurUser.precomputeReferentielSnapshot(
      collectiviteId,
      referentiel
    );
    await referentiels.updateAllReferentielStatutsToFait(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.seedRolePilotes(
      editeurUser,
      collectiviteId,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      editeurUser,
      collectiviteId,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
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

    await auditeurUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(
      auditLabellisationPom.acteEngagementRow.getByText('test-preuve.pdf')
    ).toBeVisible();
    await expect(
      auditLabellisationPom.ajouterActeEngagementButton
    ).toHaveCount(0);
    await expect(
      auditLabellisationPom.acteEngagementRow.getByTitle('Supprimer')
    ).toHaveCount(0);
  });
});
