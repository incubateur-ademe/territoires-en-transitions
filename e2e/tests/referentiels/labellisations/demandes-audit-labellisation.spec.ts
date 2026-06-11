import { expect } from '@playwright/test';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

test.describe('Demandes depuis la nouvelle vue audit-labellisation', () => {
  test('visiteur : ni « Obtenir la première étoile » ni « Demander un audit »', async ({
    page,
    collectivites,
    newAuditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);

    await expect(
      page.getByRole('button', { name: `${collectivite.data.nom} visite` })
    ).toBeVisible();

    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await expect(newAuditLabellisationPom.demanderAuditButton).toHaveCount(0);
  });

  test('première étoile : bouton désactivé tant que critères et acte manquants, puis envoi', async ({
    collectivites,
    referentiels,
    newAuditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectiviteId,
      referentiel
    );

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    await newAuditLabellisationPom.uploadActeEngagement();
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();
    await expect(newAuditLabellisationPom.demanderAuditButton).toBeDisabled();

    await newAuditLabellisationPom.demanderPremiereEtoileButton.click();
    await newAuditLabellisationPom.envoyerDemandeButton.click();
    await expect(newAuditLabellisationPom.successMessage).toBeVisible();
  });

  test('audit COT sans labellisation : envoi ferme la modale', async ({
    collectivites,
    referentiels,
    newAuditLabellisationPom,
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

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await expect(
      newAuditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await newAuditLabellisationPom.openAuditModal();
    await newAuditLabellisationPom.auditTypeCotRadio.click();
    await newAuditLabellisationPom.envoyerAuditButton.click();

    await expect(newAuditLabellisationPom.auditSuccessToast).toBeVisible();
    await expect(newAuditLabellisationPom.auditModal).toHaveCount(0);
  });

  test('audit COT avec labellisation pour la deuxième étoile', async ({
    collectivites,
    referentiels,
    newAuditLabellisationPom,
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

    await newAuditLabellisationPom.goto(collectiviteId, referentiel);
    await newAuditLabellisationPom.uploadCandidatureDocument();
    await newAuditLabellisationPom.openAuditModal();
    await newAuditLabellisationPom.auditTypeCotAvecLabellisationRadio.click();
    await newAuditLabellisationPom.selectTargetStar(2);
    await newAuditLabellisationPom.envoyerAuditButton.click();

    await expect(newAuditLabellisationPom.auditSuccessToast).toBeVisible();
  });

  for (const ref of ['cae', 'eci'] as const) {
    test(`audit de labellisation ${ref} pour la deuxième étoile`, async ({
      collectivites,
      referentiels,
      newAuditLabellisationPom,
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

      await newAuditLabellisationPom.goto(collectiviteId, ref);
      await newAuditLabellisationPom.uploadCandidatureDocument();
      await newAuditLabellisationPom.openAuditModal();
      await newAuditLabellisationPom.selectTargetStar(2);
      await newAuditLabellisationPom.envoyerAuditButton.click();

      await expect(newAuditLabellisationPom.auditSuccessToast).toBeVisible();
    });

    test(`audit de labellisation ${ref} pour la cinquième étoile`, async ({
      collectivites,
      referentiels,
      newAuditLabellisationPom,
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

      await newAuditLabellisationPom.goto(collectiviteId, ref);
      await newAuditLabellisationPom.uploadCandidatureDocument();
      await newAuditLabellisationPom.openAuditModal();
      await newAuditLabellisationPom.selectTargetStar(5);
      await newAuditLabellisationPom.envoyerAuditButton.click();

      await expect(newAuditLabellisationPom.auditSuccessToast).toBeVisible();
    });
  }
});
