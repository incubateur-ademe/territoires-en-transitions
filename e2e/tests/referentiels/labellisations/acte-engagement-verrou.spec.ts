import { expect } from '@playwright/test';
import { ObjetPreuveEnum, ReferentielId } from '@tet/domain/referentiels';
import { UserFixture } from 'tests/users/users.fixture';
import { testWithReferentiels } from '../referentiels.fixture';

const referentiel: ReferentielId = 'cae';

type CycleValide = {
  collectiviteId: number;
  auditeUser: UserFixture;
};

/** Collectivite hors COT et sans etoile : l'acte d'engagement est attendu. */
const test = testWithReferentiels.extend<{ cycleValide: CycleValide }>({
  cycleValide: async ({ collectivites, referentiels }, use) => {
    const { collectivite, user: auditeUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const collectiviteId = collectivite.data.id;
    await auditeUser.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.seedLabellisationPreuve(
      auditeUser,
      collectiviteId,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
    );
    await referentiels.validateAudit(collectiviteId, referentiel);

    await use({ collectiviteId, auditeUser });
  },
});

test.describe("Acte d'engagement — verrou apres validation", () => {
  test("une fois l'audit valide, l'audite voit son acte mais ne peut plus le modifier", async ({
    page,
    auditLabellisationPom,
    cycleValide,
  }) => {
    const { collectiviteId, auditeUser } = cycleValide;

    await auditeUser.login();
    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();

    await expect(
      auditLabellisationPom.supprimerActeEngagementButton
    ).toHaveCount(0);
  });

  test("le super admin en mode support garde la main sur l'acte", async ({
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

    await expect(page.getByText('test-preuve.pdf').first()).toBeVisible();

    await expect(
      auditLabellisationPom.supprimerActeEngagementButton
    ).toHaveCount(1);
  });
});
