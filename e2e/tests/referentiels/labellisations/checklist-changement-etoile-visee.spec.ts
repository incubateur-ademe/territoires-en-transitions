import { expect } from '@playwright/test';
import { ObjetPreuveEnum } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel = 'eci';

test.describe("Checklist audit-labellisation — changement d'étoile visée", () => {
  test("la demande d'audit de l'étoile précédente n'est plus proposée tant que le parcours de l'étoile choisie n'est pas chargé", async ({
    page,
    collectivites,
    referentiels,
    auditLabellisationPom,
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
      referentiel,
      ObjetPreuveEnum.CANDIDATURE
    );
    await referentiels.seedRolePilotes(user, collectiviteId, referentiel);

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();

    let releaseParcoursTroisiemeEtoile!: () => void;
    const parcoursTroisiemeEtoileRetenu = new Promise<void>((resolve) => {
      releaseParcoursTroisiemeEtoile = resolve;
    });
    await page.route(
      '**/trpc/referentiels.labellisations.getParcours*',
      async (route) => {
        const isTroisiemeEtoile = decodeURIComponent(
          route.request().url()
        ).includes('"etoileVisee":3');
        if (isTroisiemeEtoile) {
          await parcoursTroisiemeEtoileRetenu;
        }
        await route.continue();
      }
    );

    await auditLabellisationPom.clickTargetStar(3);
    await expect(auditLabellisationPom.demanderAuditButton).toHaveCount(0);

    releaseParcoursTroisiemeEtoile();
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();
  });
});
