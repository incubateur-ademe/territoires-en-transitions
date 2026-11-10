import { expect } from '@playwright/test';
import { ELECTRIFICATION_PLAN_TYPE_KEY } from '@tet/domain/plans';
import assert from 'node:assert/strict';
import { test } from 'tests/main.fixture';

test.describe("Création d'un plan d'action", () => {
  test('Appliquer les capacités de création, y compris après une erreur et une réouverture', async ({
    page,
    collectivites,
    createPlanPom,
    editPlanPom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const types = await user.getTrpcClient().plans.plans.listTypes.query();
    const type = types.find(
      (type) =>
        type.categorie === ELECTRIFICATION_PLAN_TYPE_KEY.categorie &&
        type.type === ELECTRIFICATION_PLAN_TYPE_KEY.type
    );
    assert(type);
    let state: 'closed' | 'error' | 'open' = 'closed';
    await page.route(
      '**/trpc/plans.plans.getCreationCapabilities*',
      async (route) => {
        if (state === 'error') {
          await route.fulfill({
            status: 500,
            json: { error: { message: 'Indisponible' } },
          });
          return;
        }
        await route.fulfill({
          json: {
            result: {
              data: { unavailableTypeIds: state === 'closed' ? [type.id] : [] },
            },
          },
        });
      }
    );
    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.typeSelect.click();
    await expect(page.getByTestId(String(type.id))).toBeDisabled();
    await expect(
      page.getByRole('button', {
        name: 'Plan Climat Air Énergie Territorial',
        exact: true,
      })
    ).toBeEnabled();

    state = 'error';
    await page.reload();
    await createPlanPom.typeSelect.click();
    await expect(page.getByTestId(String(type.id))).toBeDisabled();

    state = 'open';
    await page.reload();
    await createPlanPom.fillNom('Plan après ouverture de la création');
    await createPlanPom.typeSelect.click();
    await page.getByTestId(String(type.id)).click();
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);
    await editPlanPom.expectPlanType(type.type);
  });

  test('Créer un plan avec uniquement un nom', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // nécessaire pour que le cleanup soit bien enregistré
    createPlanPom,
    editPlanPom,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan de test';
    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectPlanIsEmpty();
  });

  test('Créer un plan avec un nom et un type', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // nécessaire pour que le cleanup soit bien enregistré
    createPlanPom,
    editPlanPom,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan avec type';
    const planType = 'Plan Climat Air Énergie Territorial';

    await createPlanPom.goto(collectivite.data.id);
    await createPlanPom.fillNom(planNom);
    await createPlanPom.typeSelect.isVisible();
    await createPlanPom.selectType(planType);
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectPlanType(planType);
    await editPlanPom.expectPlanIsEmpty();
  });

  test('Créer un plan avec un pilote et un référent', async ({
    collectivites,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    plans, // nécessaire pour que le cleanup soit bien enregistré
    createPlanPom,
    editPlanPom,
    personneTags,
  }) => {
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    // Créer des tags de personne pour le pilote et le référent
    const piloteTag = await personneTags.createPersonneTag({
      collectiviteId: collectivite.data.id,
      nom: 'Jean Dupont - Pilote',
    });

    const referentTag = await personneTags.createPersonneTag({
      collectiviteId: collectivite.data.id,
      nom: 'Marie Martin - Référente',
    });

    const planNom = 'Plan avec pilote et référent';

    await createPlanPom.goto(collectivite.data.id);

    await createPlanPom.fillNom(planNom);
    await createPlanPom.selectPilote(piloteTag.nom);
    await createPlanPom.selectReferent(referentTag.nom);
    await createPlanPom.submit();
    await createPlanPom.expectSuccess(collectivite.data.id);

    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectPiloteExists(piloteTag.nom);
    await editPlanPom.expectReferentExists(referentTag.nom);
  });

  test('Créer un plan et ajouter un axe', async ({
    collectivites,
    plans,
    editPlanPom,
    editAxePom,
  }) => {
    const { collectivite, user } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    const planNom = 'Plan créé via API';
    const planId = await plans.create(user, {
      nom: planNom,
      collectiviteId: collectivite.data.id,
    });

    await editPlanPom.goto(collectivite.data.id, planId);
    await editPlanPom.expectPlanTitle(planNom);
    await editPlanPom.expectUrl(collectivite.data.id, planId);
    await editPlanPom.expectPlanIsEmpty();

    const axeNom = 'Axe de test';
    await editAxePom.addAxe(axeNom);
    await editAxePom.expectAxeExists(axeNom);
  });
});
