import { expect } from '@playwright/test';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

test.describe('Demandes depuis la nouvelle vue audit-labellisation', () => {
  test('visiteur : ni « Obtenir la première étoile » ni « Demander un audit »', async ({
    page,
    collectivites,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await auditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(
      page.getByRole('button', { name: `${collectivite.data.nom} visite` })
    ).toBeVisible();

    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await expect(auditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('audit COT sans labellisation : envoi ferme la modale', async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
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
    await referentiels.seedRolePilotes(user, collectiviteId, referentiel);

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await auditLabellisationPom.openAuditModal();
    await auditLabellisationPom.auditTypeCotRadio.click();
    await auditLabellisationPom.envoyerAuditButton.click();

    await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
    await expect(auditLabellisationPom.auditModal).toHaveCount(0);
  });

  test('audit COT sans labellisation : demandable sans aucun référent désigné', async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
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

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();

    await auditLabellisationPom.openAuditModal();
    await auditLabellisationPom.auditTypeCotRadio.click();
    await auditLabellisationPom.envoyerAuditButton.click();

    await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
    await expect(auditLabellisationPom.auditModal).toHaveCount(0);
  });

  test('audit COT avec labellisation pour la deuxième étoile', async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
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
    await referentiels.seedRolePilotes(user, collectiviteId, referentiel);

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await auditLabellisationPom.uploadCandidatureDocument();
    await auditLabellisationPom.openAuditModal();
    await auditLabellisationPom.auditTypeCotAvecLabellisationRadio.click();
    await auditLabellisationPom.selectTargetStar(2);
    await auditLabellisationPom.envoyerAuditButton.click();

    await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
  });

  for (const ref of ['cae', 'eci'] as const) {
    test(`audit de labellisation ${ref} pour la deuxième étoile`, async ({
      collectivites,
      referentiels,
      auditLabellisationPom,
    }) => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        { userArgs: { autoLogin: true } }
      );
      const collectiviteId = collectivite.data.id;
      await user.precomputeReferentielSnapshot(collectiviteId, ref);
      await referentiels.seedLabellisationObtenue({
        collectiviteId,
        referentielId: ref,
        etoiles: 1,
      });
      await referentiels.updateAllReferentielStatutsToFait(
        user,
        collectiviteId,
        ref
      );
      await referentiels.seedRolePilotes(user, collectiviteId, ref);

      await auditLabellisationPom.goto(collectiviteId, ref);
      await auditLabellisationPom.uploadCandidatureDocument();
      await auditLabellisationPom.openAuditModal();
      await auditLabellisationPom.selectTargetStar(2);
      await auditLabellisationPom.envoyerAuditButton.click();

      await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
    });

    test(`audit de labellisation ${ref} pour la cinquième étoile`, async ({
      collectivites,
      referentiels,
      auditLabellisationPom,
    }) => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        { userArgs: { autoLogin: true } }
      );
      const collectiviteId = collectivite.data.id;
      await user.precomputeReferentielSnapshot(collectiviteId, ref);
      await referentiels.seedLabellisationObtenue({
        collectiviteId,
        referentielId: ref,
        etoiles: 1,
      });
      await referentiels.updateAllReferentielStatutsToFait(
        user,
        collectiviteId,
        ref
      );
      await referentiels.seedRolePilotes(user, collectiviteId, ref);

      await auditLabellisationPom.goto(collectiviteId, ref);
      await auditLabellisationPom.uploadCandidatureDocument();
      await auditLabellisationPom.openAuditModal();
      await auditLabellisationPom.selectTargetStar(5);
      await auditLabellisationPom.envoyerAuditButton.click();

      await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
    });
  }
});
