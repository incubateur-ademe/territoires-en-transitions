import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { CollectiviteFixture } from 'tests/collectivite/collectivites.fixture';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithReferentiels } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

type CycleValide = {
  collectiviteId: number;
  editeurUser: UserFixture;
};

/** Cycle dont l'audit est validé, avec un document de candidature déposé. */
const test = testWithReferentiels.extend<{ cycleValide: CycleValide }>({
  cycleValide: async ({ collectivites, referentiels }, use) => {
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
    await referentiels.startAudit(auditeurUser, collectiviteId, referentiel);
    await referentiels.validateAudit(collectiviteId, referentiel);

    await use({ collectiviteId, editeurUser });
  },
});

test.describe('Documents de candidature — verrou apres validation', () => {
  test("une fois l'audit valide, l'editeur voit ses documents mais ne peut plus les modifier", async ({
    page,
    auditLabellisationPom,
    cycleValide,
  }) => {
    const { collectiviteId, editeurUser } = cycleValide;

    await editeurUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(auditLabellisationPom.candidatureDocumentsTitle).toBeVisible();
    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();

    await expect(
      auditLabellisationPom.ajouterDocumentCandidatureButton
    ).toHaveCount(0);
    await expect(
      auditLabellisationPom.renommerDocumentCandidatureButton
    ).toHaveCount(0);
    await expect(
      auditLabellisationPom.supprimerDocumentCandidatureButton
    ).toHaveCount(0);
  });

  test('le super admin en mode support garde la main sur les documents du cycle', async ({
    page,
    collectivites,
    auditLabellisationPom,
    cycleValide,
  }) => {
    const { collectiviteId } = cycleValide;

    const { user: superAdminUser } = await collectivites.addCollectiviteAndUser({
      userArgs: {
        autoLogin: true,
        isSupport: true,
        isSuperAdminRoleEnabled: true,
      },
    });

    await superAdminUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(auditLabellisationPom.candidatureDocumentsTitle).toBeVisible();
    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();

    await expect(
      auditLabellisationPom.ajouterDocumentCandidatureButton
    ).toHaveCount(1);
    await expect(
      auditLabellisationPom.renommerDocumentCandidatureButton
    ).toHaveCount(1);
    await expect(
      auditLabellisationPom.supprimerDocumentCandidatureButton
    ).toHaveCount(1);
  });
});
