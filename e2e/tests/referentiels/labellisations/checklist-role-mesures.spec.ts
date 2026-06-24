import { expect } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';
import { RoleKey } from './new-audit-labellisation.pom';

type Scenario = {
  referentiel: ReferentielId;
  role: RoleKey;
  formulationPattern: RegExp;
};

const referentiels: ReferentielId[] = ['cae', 'eci'];

const roles: RoleKey[] = ['eluReferent', 'referentTechnique'];

/**
 * CAE et ECI exposent les mêmes mesures de rôle avec une formulation
 * identique dans la checklist ; seul l'identifiant d'action diffère.
 */
const rolePattern: Record<RoleKey, RegExp> = {
  eluReferent: /Identifier un.+lu.+r.+f.+rent/i,
  referentTechnique: /Identifier une personne technique/i,
};

const scenarios: Scenario[] = referentiels.flatMap((referentiel) =>
  roles.map((role) => ({
    referentiel,
    role,
    formulationPattern: rolePattern[role],
  }))
);

/**
 * Assigner un rôle déclenche une chaîne de 3 requêtes séquentielles (upsert
 * des pilotes → mise à Fait du statut → invalidation du parcours) avant que
 * l'icône du critère ne se rafraîchisse. Les 5 s du timeout par défaut sont
 * trop justes pour ce parcours réseau.
 */
const ASSIGNATION_REFRESH_TIMEOUT = 15_000;

test.describe('Checklist audit-labellisation — assignation rôle ↔ statut mesure', () => {
  test.beforeEach(async ({ page, collectivites }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    // La checklist charge le parcours depuis le snapshot du référentiel :
    // sans pré-calcul, `getParcours` échoue faute de snapshot existant.
    for (const referentiel of referentiels) {
      await user.precomputeReferentielSnapshot(
        collectivite.data.id,
        referentiel
      );
    }
    await page.goto('/');
  });

  for (const { referentiel, role, formulationPattern } of scenarios) {
    test(`${referentiel.toUpperCase()} ${role} : assigner via le dropdown fait passer la mesure de non atteint à atteint`, async ({
      page,
      newAuditLabellisationPom,
      collectivites,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
    }) => {
      const collectivite = collectivites.getCollectivite();
      const user = collectivite.getUser(0);
      const userFullName = `${user.data.prenom} ${user.data.nom}`;

      await newAuditLabellisationPom.goto(collectivite.data.id, referentiel);

      const row = newAuditLabellisationPom.checklistRow(formulationPattern);
      await expect(row.getByLabel('Critère non atteint')).toBeVisible();

      // Ouvre le dropdown du rôle dans le header
      await newAuditLabellisationPom.roleHeaderItem(role).click();

      const statutSaved = page.waitForResponse((response) =>
        response.url().includes('updateStatut')
      );
      const parcoursReloaded = page.waitForResponse((response) =>
        response.url().includes('getParcours')
      );

      // Sélectionne l'utilisateur courant (les entrées du dropdown DS sont
      // rendues comme des boutons, pas des options ARIA)
      await page.getByRole('button', { name: userFullName }).click();
      await statutSaved;
      await parcoursReloaded;

      // Ferme le dropdown
      await page.keyboard.press('Escape');

      // La ligne de la mesure est maintenant "Critère atteint"
      await expect(row.getByLabel('Critère atteint')).toBeVisible({
        timeout: ASSIGNATION_REFRESH_TIMEOUT,
      });
    });
  }

  test("CAE — créer un tag libre depuis le dropdown rôle l'assigne et complète la mesure", async ({
    page,
    newAuditLabellisationPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
  }) => {
    const collectivite = collectivites.getCollectivite();
    const tagLibre = 'Personne Tag Libre Test';

    await newAuditLabellisationPom.goto(collectivite.data.id, 'cae');

    const row = newAuditLabellisationPom.checklistRow(
      /Identifier un.+lu.+r.+f.+rent/i
    );
    await expect(row.getByLabel('Critère non atteint')).toBeVisible();

    await newAuditLabellisationPom.roleHeaderItem('eluReferent').click();
    await newAuditLabellisationPom.roleSearchInput.fill(tagLibre);

    const statutSaved = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    const parcoursReloaded = page.waitForResponse((response) =>
      response.url().includes('getParcours')
    );
    await newAuditLabellisationPom.createTagButton(tagLibre).click();
    await statutSaved;
    await parcoursReloaded;

    await page.keyboard.press('Escape');

    await expect(row.getByLabel('Critère atteint')).toBeVisible({
      timeout: ASSIGNATION_REFRESH_TIMEOUT,
    });
  });

  test("CAE — le CTA « Renseigner » au survol d'une ligne rôle ouvre le dropdown du header", async ({
    newAuditLabellisationPom,
    collectivites,
  }) => {
    const collectivite = collectivites.getCollectivite();

    await newAuditLabellisationPom.goto(collectivite.data.id, 'cae');

    const row = newAuditLabellisationPom.checklistRow(
      /Identifier un.+lu.+r.+f.+rent/i
    );
    await row.hover();
    await row.getByRole('button', { name: 'Renseigner' }).click();

    await expect(newAuditLabellisationPom.roleSearchInput).toBeVisible();
  });

  test('CAE eluReferent : retirer le pilote refait passer le critère de atteint à non atteint', async ({
    page,
    newAuditLabellisationPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);
    const userFullName = `${user.data.prenom} ${user.data.nom}`;

    await newAuditLabellisationPom.goto(collectivite.data.id, 'cae');

    const row = newAuditLabellisationPom.checklistRow(
      /Identifier un.+lu.+r.+f.+rent/i
    );
    await expect(row.getByLabel('Critère non atteint')).toBeVisible();

    await newAuditLabellisationPom.roleHeaderItem('eluReferent').click();
    const statutSaved = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    const parcoursReloaded = page.waitForResponse((response) =>
      response.url().includes('getParcours')
    );
    await page.getByRole('button', { name: userFullName }).click();
    await statutSaved;
    await parcoursReloaded;
    await page.keyboard.press('Escape');
    await expect(row.getByLabel('Critère atteint')).toBeVisible({
      timeout: ASSIGNATION_REFRESH_TIMEOUT,
    });

    await newAuditLabellisationPom.roleHeaderItem('eluReferent').click();
    await newAuditLabellisationPom.roleDropdownOption(userFullName).click();
    await page.keyboard.press('Escape');

    await expect(row.getByLabel('Critère non atteint')).toBeVisible({
      timeout: ASSIGNATION_REFRESH_TIMEOUT,
    });
  });

  test("Visiteur — pas de bouton « Renseigner » sur une mesure de rôle", async ({
    page,
    newAuditLabellisationPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const editeurCollectivite = collectivites.getCollectivite();

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await newAuditLabellisationPom.goto(editeurCollectivite.data.id, 'cae');

    await expect(
      page.getByRole('button', { name: `${editeurCollectivite.data.nom} visite` })
    ).toBeVisible();

    const row = newAuditLabellisationPom.checklistRow(
      /Identifier un.+lu.+r.+f.+rent/i
    );
    await row.hover();

    await expect(
      row.getByRole('button', { name: 'Renseigner' })
    ).toHaveCount(0);
  });

  test("Visiteur — le trigger d'édition du rôle dans le header n'ouvre pas le dropdown", async ({
    page,
    newAuditLabellisationPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const editeurCollectivite = collectivites.getCollectivite();

    await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await newAuditLabellisationPom.goto(editeurCollectivite.data.id, 'cae');

    await expect(
      page.getByRole('button', { name: `${editeurCollectivite.data.nom} visite` })
    ).toBeVisible();

    await newAuditLabellisationPom.roleHeaderItem('eluReferent').click();
    await expect(newAuditLabellisationPom.roleSearchInput).toHaveCount(0);
  });

  test("CAE référent technique : assigner puis retirer met à jour le statut de la mesure sur la page référentiel sans recharger", async ({
    page,
    newAuditLabellisationPom,
    referentielScoresPom,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // déclenche le cleanup des action_statut (FK action_statut.modified_by → user)
  }) => {
    const collectivite = collectivites.getCollectivite();
    const user = collectivite.getUser(0);
    const userFullName = `${user.data.prenom} ${user.data.nom}`;

    const AXE = 'Organisation interne';
    const SOUS_AXE = 'Gouvernance';
    const ACTION =
      'Organiser les ressources humaines pour mener la politique climat-air-énergie';
    const ROLE_TACHE = '5.1.1.1.3';

    await newAuditLabellisationPom.goto(collectivite.data.id, 'cae');

    await newAuditLabellisationPom.roleHeaderItem('referentTechnique').click();
    const statutMisAFait = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    await page.getByRole('button', { name: userFullName }).click();
    await page.keyboard.press('Escape');
    await statutMisAFait;

    // Navigation client-side (sans `page.goto`) : un rechargement complet
    // viderait le cache React Query et masquerait la régression. L'assignation
    // de rôle écrit un statut de tâche et doit invalider `listActionsGroupedById`.
    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);
    await referentielScoresPom.expandSousAction('5.1.1.1');
    await expect(
      referentielScoresPom.getTacheAvancementSelectLocator(ROLE_TACHE)
    ).toContainText('Fait', { timeout: ASSIGNATION_REFRESH_TIMEOUT });

    await newAuditLabellisationPom.goto(collectivite.data.id, 'cae');
    await newAuditLabellisationPom.roleHeaderItem('referentTechnique').click();
    const statutRemisANonRenseigne = page.waitForResponse((response) =>
      response.url().includes('updateStatut')
    );
    await newAuditLabellisationPom.roleDropdownOption(userFullName).click();
    await page.keyboard.press('Escape');
    await statutRemisANonRenseigne;

    await referentielScoresPom.goto('cae');
    await referentielScoresPom.goToActionPage(AXE, SOUS_AXE, ACTION);
    await referentielScoresPom.expandSousAction('5.1.1.1');
    await expect(
      referentielScoresPom.getTacheAvancementSelectLocator(ROLE_TACHE)
    ).toContainText('Non renseigné', { timeout: ASSIGNATION_REFRESH_TIMEOUT });
  });
});
