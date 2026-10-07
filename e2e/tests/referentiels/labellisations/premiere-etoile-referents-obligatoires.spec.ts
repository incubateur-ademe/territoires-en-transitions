import { expect } from '@playwright/test';
import {
  AuditLabellisationReferentielId,
  ObjetPreuveEnum,
} from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';

const referentiel: AuditLabellisationReferentielId = 'cae';

const ELU_REFERENT = /Identifier un.+lu.+r.+f.+rent/i;
const REFERENT_TECHNIQUE = /Identifier une personne technique/i;
const EQUIPE_PROJET = /Mettre en place une .+quipe projet/i;

test.describe('Demande 1ère étoile — désignation des référents obligatoire', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await user.precomputeReferentielSnapshot(collectivite.data.id, referentiel);

    await page.goto('/');
  });

  test('une mesure de rôle sans référent désigné est non atteinte et le bouton désactivé ; désigner les référents la remplit et active le bouton', async ({
    auditLabellisationPom,
    collectivites,
    referentiels,
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);

    await referentiels.updateAllNeedReferentielStatutsToCompleteReferentiel(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.updateAllNeedReferentielStatutsToMatchReferentielScoreCriteria(
      user,
      collectivite.data.id,
      referentiel
    );
    await referentiels.seedLabellisationPreuve(
      user,
      collectivite.data.id,
      referentiel,
      ObjetPreuveEnum.ACTE_ENGAGEMENT
    );

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    const eluReferentRow = auditLabellisationPom.checklistRow(ELU_REFERENT);
    const referentTechniqueRow =
      auditLabellisationPom.checklistRow(REFERENT_TECHNIQUE);

    // Les mesures de rôle portent le même statut « Fait » que les autres
    // critères : seule la désignation les distingue.
    await expect(
      auditLabellisationPom
        .checklistRow(EQUIPE_PROJET)
        .getByLabel('Critère atteint')
    ).toBeVisible();
    await expect(
      eluReferentRow.getByLabel('Critère non atteint')
    ).toBeVisible();
    await expect(
      referentTechniqueRow.getByLabel('Critère non atteint')
    ).toBeVisible();
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeDisabled();

    await referentiels.seedRolePilotes(user, collectivite.data.id, referentiel);

    await auditLabellisationPom.goto(collectivite.data.id, referentiel);

    await expect(eluReferentRow.getByLabel('Critère atteint')).toBeVisible();
    await expect(
      referentTechniqueRow.getByLabel('Critère atteint')
    ).toBeVisible();
    await expect(
      auditLabellisationPom.demanderPremiereEtoileButton
    ).toBeEnabled();
  });
});
