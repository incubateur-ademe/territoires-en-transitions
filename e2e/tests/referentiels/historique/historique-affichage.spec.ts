import { expect } from '@playwright/test';
import { CollectiviteRole } from '@tet/domain/users';
import { test } from 'tests/main.fixture';
import {
  ensureTestQuestion,
  seedActionPrecision,
  seedActionStatut,
  seedActionStatutAt,
  seedJustification,
  seedReponse,
} from './historique-seed';
import { HistoriquePom } from './historique.pom';

/**
 * Vérifie que la page `/historique` affiche l'actionType calculé côté backend
 * et que les filtres par type et par membre réagissent aux interactions.
 */
test.describe('Historique — affichage', () => {
  test('Les labels Tâche et Sous-mesure proviennent du actionType backend', async ({
    page,
    collectivites,
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    // Statut sur une tâche (cae_1.1.1.1.2 → profondeur 5 → tache)
    await referentiels.updateActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1.2',
      avancement: 'fait',
      avancementDetaille: null,
      concerne: true,
    });
    // Statut sur une sous-mesure (cae_1.1.1.1 → profondeur 4 → sous-action)
    await referentiels.updateActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1',
      avancement: 'fait',
      avancementDetaille: null,
      concerne: true,
    });

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);

    await expect(historiquePom.items).toHaveCount(2);

    // `1.1.1.1` est préfixe de `1.1.1.1.2`, donc on ancre chaque regex sur
    // le label du descripteur (`Tâche :` / `Sous-mesure :`) pour éviter que
    // le filtre de la tâche attrape aussi la ligne sous-mesure.
    const tacheItem = historiquePom.itemContaining(
      /Tâche\s*:\s*1\.1\.1\.1\.2\b/
    );
    await expect(tacheItem).toContainText('Tâche');

    const sousMesureItem = historiquePom.itemContaining(
      /Sous-mesure\s*:\s*1\.1\.1\.1(?!\.)/
    );
    await expect(sousMesureItem).toContainText('Sous-mesure');
  });

  test("État vide affiché quand la collectivité n'a aucun historique", async ({
    page,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels, // enregistre le cleanup even si non utilisé directement
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);

    await expect(historiquePom.emptyState).toBeVisible();
  });

  test('Les 4 types de modification sont affichés', async ({
    page,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await ensureTestQuestion();

    await seedActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1.2',
    });
    await seedActionPrecision(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1',
    });
    await seedReponse(user, { collectiviteId: collectivite.data.id });
    await seedJustification(user, {
      collectiviteId: collectivite.data.id,
    });

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);

    await expect(historiquePom.items).toHaveCount(4);
    await expect(historiquePom.list).toContainText('Mesure : statut modifié');
    await expect(historiquePom.list).toContainText('Mesure : texte modifié');
    await expect(historiquePom.list).toContainText(
      'Caractéristique de la collectivité modifiée'
    );
    await expect(historiquePom.list).toContainText(
      "Justification d'une caractéristique de la collectivité modifiée"
    );
  });

  test('Le filtre par type ne garde que les entrées sélectionnées', async ({
    page,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await ensureTestQuestion();

    await seedActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1.2',
    });
    await seedActionPrecision(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1',
    });
    await seedReponse(user, { collectiviteId: collectivite.data.id });

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);

    await expect(historiquePom.items).toHaveCount(3);

    await historiquePom.filterByType('action_statut');

    await expect(historiquePom.items).toHaveCount(1);
    await expect(historiquePom.items.first()).toContainText(
      'Mesure : statut modifié'
    );
  });

  test('Le filtre par membre ne garde que les modifications du membre sélectionné', async ({
    page,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await seedActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1.2',
    });

    const secondUser = await collectivite.addUser({
      role: CollectiviteRole.EDITION,
      autoLogin: true,
    });
    await seedActionStatut(secondUser, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1',
    });

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);

    await expect(historiquePom.items).toHaveCount(2);

    await historiquePom.filterByMember(user.data.id);

    await expect(historiquePom.items).toHaveCount(1);
    await expect(historiquePom.items.first()).toContainText(
      `Par : ${user.data.prenom} ${user.data.nom}`
    );
  });

  test('Le filtre par plage de dates isole correctement jour courant / veille / plage', async ({
    page,
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    referentiels,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    // Jour courant : seedActionStatut utilise now() côté DB.
    await seedActionStatut(user, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1.2',
    });
    // Hier : insert direct pour fixer le modifiedAt 24h plus tôt.
    const yesterdayIso = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();
    await seedActionStatutAt(user.data.id, {
      collectiviteId: collectivite.data.id,
      actionId: 'cae_1.1.1.1',
      modifiedAt: yesterdayIso,
    });

    const todayYmd = new Date().toISOString().slice(0, 10);
    const yesterdayYmd = yesterdayIso.slice(0, 10);

    const historiquePom = new HistoriquePom(page);
    await historiquePom.goto(collectivite.data.id);
    await expect(historiquePom.items).toHaveCount(2);

    // Plage jour courant uniquement : on ne garde que la modification d'aujourd'hui.
    await historiquePom.filterByPeriod({
      startDate: todayYmd,
      endDate: todayYmd,
    });
    await expect(historiquePom.items).toHaveCount(1);
    await expect(historiquePom.items.first()).toContainText('1.1.1.1.2');

    // Plage "hier → aujourd'hui" : on attend les 2 modifications.
    await historiquePom.filterByPeriod({
      startDate: yesterdayYmd,
      endDate: todayYmd,
    });
    await expect(historiquePom.items).toHaveCount(2);

    // Plage limitée à hier : uniquement la modification de la veille.
    await historiquePom.filterByPeriod({
      startDate: yesterdayYmd,
      endDate: yesterdayYmd,
    });
    await expect(historiquePom.items).toHaveCount(1);
    await expect(historiquePom.items.first()).toContainText(
      /Sous-mesure\s*:\s*1\.1\.1\.1(?!\.)/
    );
  });
});
