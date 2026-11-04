import { expect } from '@playwright/test';
import { AuditLabellisationReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

const COMPLETUDE_TOOLTIP =
  'Renseigner les statuts de toutes les mesures du référentiel';
const CRITERES_TOOLTIP =
  'Renseigner tous les critères attendus afin de pouvoir demander un audit ou une labellisation';

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

  test('CT COT sans statuts renseignés, audit COT seul : CTA désactivé, le tooltip nomme la complétude', async ({
    collectivites,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
      collectiviteArgs: { isCOT: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await auditLabellisationPom.demanderAuditCotSansLabellisation();

    await expect(auditLabellisationPom.demanderAuditButton).toBeDisabled();
    await auditLabellisationPom.hoverDemanderAudit();
    await expect(auditLabellisationPom.tooltip).toHaveText(COMPLETUDE_TOOLTIP);
  });

  test("CT COT complète sous 35 % : l'audit COT seul est demandable, sans étoile ni critère de labellisation", async ({
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
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await auditLabellisationPom.demanderAuditCotSansLabellisation();

    await expect(auditLabellisationPom.scoreMinimumRow).toHaveCount(0);
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();

    await auditLabellisationPom.openAuditModal();
    await expect(
      auditLabellisationPom.auditModal.getByText('Audit COT sans labellisation')
    ).toBeVisible();
    await auditLabellisationPom.envoyerAuditButton.click();

    await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
  });

  test('CT non-COT complète sous 35 % visant la deuxième étoile : CTA désactivé, le tooltip renvoie aux critères', async ({
    collectivites,
    referentiels,
    auditLabellisationPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const collectiviteId = collectivite.data.id;
    await user.precomputeReferentielSnapshot(collectiviteId, referentiel);
    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectiviteId,
      referentiel
    );

    await auditLabellisationPom.goto(collectiviteId, referentiel);
    await auditLabellisationPom.selectTargetStar(2);

    await expect(auditLabellisationPom.demanderAuditButton).toBeDisabled();
    await auditLabellisationPom.hoverDemanderAudit();
    await expect(auditLabellisationPom.tooltip).toHaveText(CRITERES_TOOLTIP);
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
    await auditLabellisationPom.demanderAuditCotSansLabellisation();
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toHaveCount(0);
    await auditLabellisationPom.openAuditModal();
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
    await auditLabellisationPom.demanderAuditCotSansLabellisation();
    await expect(auditLabellisationPom.demanderAuditButton).toBeEnabled();

    await auditLabellisationPom.openAuditModal();
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
    await auditLabellisationPom.selectTargetStar(2);
    await expect(auditLabellisationPom.labellisationCotSwitch).toBeChecked();
    await auditLabellisationPom.uploadCandidatureDocument();
    await auditLabellisationPom.openAuditModal();
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
      await auditLabellisationPom.selectTargetStar(2);
      await auditLabellisationPom.uploadCandidatureDocument();
      await expect(auditLabellisationPom.labellisationCotSwitch).toHaveCount(0);
      await auditLabellisationPom.openAuditModal();
      await expect(
        auditLabellisationPom.auditModal.getByText(
          'Étoile demandée : deuxième étoile'
        )
      ).toBeVisible();
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
      await auditLabellisationPom.selectTargetStar(5);
      await auditLabellisationPom.uploadCandidatureDocument();
      await auditLabellisationPom.openAuditModal();
      await auditLabellisationPom.envoyerAuditButton.click();

      await expect(auditLabellisationPom.auditSuccessToast).toBeVisible();
    });
  }
});
