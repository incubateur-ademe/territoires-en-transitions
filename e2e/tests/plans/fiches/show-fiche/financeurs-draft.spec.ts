import { expect } from '@playwright/test';
import { testWithFiches } from 'tests/plans/fiches/fiches.fixture';

const test = testWithFiches;

type StoredDraft = {
  draftId: string;
  ficheId: number;
  financeurTagId?: number;
  montantTtc?: number;
};

test.describe('Financeurs — brouillons persistés en localStorage', () => {
  test('un brouillon partiel (financeur sans montant) persiste après reload', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche test brouillon financeur',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    const financeursRegion = page.getByRole('region', { name: 'Financeurs' });
    await expect(financeursRegion).toBeVisible();

    // Crée une ligne brouillon
    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();

    // Ouvre la cellule financeur et crée un tag à la volée
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();

    const financeurName = `Financeur test ${Date.now()}`;
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurName);
    await page.getByRole('button', { name: /Créer/ }).click();

    // Le nom remplace le placeholder, le montant reste en brouillon
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();
    await expect(
      financeursRegion.getByRole('cell', { name: 'Ajouter un montant' })
    ).toBeVisible();

    await page.reload();

    // Après reload, le brouillon est toujours visible
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();
    await expect(
      financeursRegion.getByRole('cell', { name: 'Ajouter un montant' })
    ).toBeVisible();

    // Et le localStorage contient exactement une entrée pour cette fiche
    const storageKey = `tet_financeurs_draft_${ficheId}`;
    const rawStorage = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      storageKey
    );
    expect(rawStorage).not.toBeNull();
    if (rawStorage === null) return;

    const storage: Record<string, StoredDraft> = JSON.parse(rawStorage);
    const drafts = Object.values(storage);
    expect(drafts).toEqual([
      {
        draftId: expect.any(String),
        ficheId,
        financeurTagId: expect.any(Number),
      },
    ]);
  });

  test("un brouillon est scopé à une fiche et n'apparaît pas sur une autre", async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheAId, ficheBId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche A brouillon scope',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
      {
        titre: 'Fiche B brouillon scope',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    const financeursRegion = page.getByRole('region', { name: 'Financeurs' });

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheAId}/budget`
    );
    await expect(financeursRegion).toBeVisible();

    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();

    const financeurName = `Financeur scope ${Date.now()}`;
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurName);
    await page.getByRole('button', { name: /Créer/ }).click();

    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();

    // Fiche B : pas de brouillon
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheBId}/budget`
    );
    await expect(financeursRegion).toBeVisible();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toHaveCount(0);

    // Retour sur la fiche A : le brouillon est toujours là
    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheAId}/budget`
    );
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();

    // localStorage : clé A non vide, clé B absente ou vide
    const storageState = await page.evaluate(
      ([keyA, keyB]) => ({
        a: window.localStorage.getItem(keyA),
        b: window.localStorage.getItem(keyB),
      }),
      [
        `tet_financeurs_draft_${ficheAId}`,
        `tet_financeurs_draft_${ficheBId}`,
      ]
    );
    expect(storageState.a).not.toBeNull();
    if (storageState.a === null) return;
    expect(Object.keys(JSON.parse(storageState.a))).toHaveLength(1);
    if (storageState.b !== null) {
      expect(Object.keys(JSON.parse(storageState.b))).toHaveLength(0);
    }
  });

  test('un brouillon complet est consommé : la ligne devient persistée et le brouillon disparaît', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche brouillon save',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    const financeursRegion = page.getByRole('region', { name: 'Financeurs' });
    await expect(financeursRegion).toBeVisible();

    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();

    // Sélection du financeur
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();
    const financeurName = `Financeur complet ${Date.now()}`;
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurName);
    await page.getByRole('button', { name: /Créer/ }).click();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();

    // Saisie du montant
    await financeursRegion
      .getByRole('cell', { name: 'Ajouter un montant' })
      .click();
    const montantInput = page.getByRole('textbox', {
      name: 'Montant de subvention obtenu',
    });
    await montantInput.fill('12345');
    await montantInput.press('Enter');

    // Le placeholder « Ajouter un montant » disparaît, le montant formaté apparaît
    await expect(
      financeursRegion.getByRole('cell', { name: 'Ajouter un montant' })
    ).toHaveCount(0);
    await expect(financeursRegion.getByText('12 345 €')).toBeVisible();

    // Reload : la ligne persistée est toujours là
    await page.reload();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();
    await expect(financeursRegion.getByText('12 345 €')).toBeVisible();

    // localStorage : plus aucun brouillon pour cette fiche
    const raw = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `tet_financeurs_draft_${ficheId}`
    );
    if (raw !== null) {
      const parsed: Record<string, StoredDraft> = JSON.parse(raw);
      expect(Object.keys(parsed)).toHaveLength(0);
    }
  });

  test("la suppression d'un brouillon le retire de la liste et du localStorage", async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche brouillon delete',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    const financeursRegion = page.getByRole('region', { name: 'Financeurs' });
    await expect(financeursRegion).toBeVisible();

    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();

    const financeurName = `Financeur delete ${Date.now()}`;
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurName);
    await page.getByRole('button', { name: /Créer/ }).click();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toBeVisible();

    // Supprime la ligne via la modale de confirmation
    await financeursRegion
      .getByRole('button', { name: 'Supprimer le financeur' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Valider' })
      .click();

    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toHaveCount(0);

    // Reload : toujours rien
    await page.reload();
    await expect(financeursRegion).toBeVisible();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurName })
    ).toHaveCount(0);

    const raw = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `tet_financeurs_draft_${ficheId}`
    );
    if (raw !== null) {
      const parsed: Record<string, StoredDraft> = JSON.parse(raw);
      expect(Object.keys(parsed)).toHaveLength(0);
    }
  });

  test('deux brouillons partiels coexistent après reload', async ({
    page,
    collectivites,
    fiches,
  }) => {
    const { collectivite, user: adminUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { role: 'admin', autoLogin: true },
      });

    const [ficheId] = await fiches.create(adminUser, [
      {
        titre: 'Fiche brouillon coexist',
        collectiviteId: collectivite.data.id,
        statut: 'En cours',
      },
    ]);

    await page.goto(
      `/collectivite/${collectivite.data.id}/actions/${ficheId}/budget`
    );

    const financeursRegion = page.getByRole('region', { name: 'Financeurs' });
    await expect(financeursRegion).toBeVisible();

    const suffix = Date.now();
    const financeurA = `Financeur coexist A ${suffix}`;
    const financeurB = `Financeur coexist B ${suffix}`;

    // Premier brouillon
    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurA);
    await page.getByRole('button', { name: /Créer/ }).click();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurA })
    ).toBeVisible();

    // Second brouillon
    await financeursRegion
      .getByRole('button', { name: 'Ajouter un financeur' })
      .click();
    await financeursRegion
      .getByRole('cell', { name: 'Sélectionner un financeur' })
      .click();
    await page
      .getByPlaceholder('Sélectionner ou créer un financeur')
      .fill(financeurB);
    await page.getByRole('button', { name: /Créer/ }).click();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurB })
    ).toBeVisible();

    await page.reload();

    await expect(
      financeursRegion.getByRole('cell', { name: financeurA })
    ).toBeVisible();
    await expect(
      financeursRegion.getByRole('cell', { name: financeurB })
    ).toBeVisible();

    const raw = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      `tet_financeurs_draft_${ficheId}`
    );
    expect(raw).not.toBeNull();
    if (raw === null) return;
    const parsed: Record<string, StoredDraft> = JSON.parse(raw);
    expect(Object.keys(parsed)).toHaveLength(2);
  });
});
