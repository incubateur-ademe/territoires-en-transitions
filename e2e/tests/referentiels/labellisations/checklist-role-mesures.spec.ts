import { expect, Page } from '@playwright/test';
import { ReferentielId } from '@tet/domain/referentiels';
import { testWithReferentiels as test } from '../referentiels.fixture';
import {
  NewAuditLabellisationPom,
  RoleKey,
} from './new-audit-labellisation.pom';

type RoleAssignment =
  | { kind: 'utilisateur' }
  | { kind: 'tagLibre'; nom: string };

type RoleScenario = {
  formulationPattern: RegExp;
  assignment: RoleAssignment;
};

type Scenario = RoleScenario & {
  referentiel: ReferentielId;
  role: RoleKey;
};

const referentiels: ReferentielId[] = ['cae', 'eci'];

const roles: RoleKey[] = ['eluReferent', 'referentTechnique'];

/**
 * CAE et ECI exposent les mêmes mesures de rôle avec une formulation
 * identique dans la checklist ; seul l'identifiant d'action diffère.
 */
const roleScenarios: Record<RoleKey, RoleScenario> = {
  eluReferent: {
    formulationPattern: /Identifier un.+lu.+r.+f.+rent/i,
    assignment: { kind: 'utilisateur' },
  },
  referentTechnique: {
    formulationPattern: /Identifier une personne technique/i,
    assignment: { kind: 'utilisateur' },
  },
};

const scenarios: Scenario[] = referentiels.flatMap((referentiel) =>
  roles.map((role) => ({ referentiel, role, ...roleScenarios[role] }))
);

/**
 * Assigner un rôle déclenche une chaîne de requêtes séquentielles (upsert des
 * pilotes → mise à Fait du statut → invalidation du parcours) avant que l'icône
 * du critère ne se rafraîchisse. Les 5 s du timeout par défaut sont trop justes
 * pour ce parcours réseau.
 */
const ASSIGNATION_REFRESH_TIMEOUT = 15_000;

const assignRole = async (
  pom: NewAuditLabellisationPom,
  page: Page,
  assignment: RoleAssignment,
  userFullName: string
): Promise<void> => {
  switch (assignment.kind) {
    case 'tagLibre': {
      await pom.roleSearchInput.fill(assignment.nom);
      const statutSaved = page.waitForResponse((response) =>
        response.url().includes('updateStatut')
      );
      await pom.createTagButton.click();
      await statutSaved;
      await page.waitForResponse((response) =>
        response.url().includes('getParcours')
      );
      await page.keyboard.press('Escape');
      return;
    }
    case 'utilisateur':
      await page.getByRole('button', { name: userFullName }).click();
      await page.keyboard.press('Escape');
      return;
  }
};

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

  for (const {
    referentiel,
    role,
    formulationPattern,
    assignment,
  } of scenarios) {
    test(`${referentiel.toUpperCase()} ${role} : assigner (${
      assignment.kind
    }) fait passer la mesure de non atteint à atteint`, async ({
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

      await newAuditLabellisationPom.roleHeaderItem(role).click();
      await assignRole(
        newAuditLabellisationPom,
        page,
        assignment,
        userFullName
      );

      await expect(row.getByLabel('Critère atteint')).toBeVisible({
        timeout: ASSIGNATION_REFRESH_TIMEOUT,
      });
    });
  }

  test("CAE eluReferent : retirer le pilote via le dropdown refait passer le critère de atteint à non atteint", async ({
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
    await assignRole(
      newAuditLabellisationPom,
      page,
      { kind: 'utilisateur' },
      userFullName
    );
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
    // viderait le cache React Query et masquerait la régression. Le bug était
    // une invalidation manquante de `listActionsGroupedById` après l'écriture
    // du statut depuis l'assignation de rôle.
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
      page.getByRole('button', {
        name: `${editeurCollectivite.data.nom} visite`,
      })
    ).toBeVisible();

    const row = newAuditLabellisationPom.checklistRow(
      /Identifier un.+lu.+r.+f.+rent/i
    );
    await row.hover();

    await expect(
      row.getByRole('button', { name: 'Renseigner' })
    ).toHaveCount(0);
  });

  test("Visiteur — le trigger d'édition du rôle dans le header est désactivé", async ({
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
      page.getByRole('button', {
        name: `${editeurCollectivite.data.nom} visite`,
      })
    ).toBeVisible();

    await expect(
      newAuditLabellisationPom.roleHeaderItem('eluReferent')
    ).toBeDisabled();
    await expect(
      newAuditLabellisationPom.roleHeaderItem('referentTechnique')
    ).toBeDisabled();
  });
});
