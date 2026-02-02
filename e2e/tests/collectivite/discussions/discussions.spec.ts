import { test } from 'tests/main.fixture';

test.describe('Discussions', () => {
  let collectiviteId: number;
  const referentielId = 'cae';
  const actionId = 'cae_1.1.1';

  test.beforeEach(
    async ({
      collectivites,
      discussions,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      referentiels,
    }) => {
      const { collectivite, user } = await collectivites.addCollectiviteAndUser(
        {
          userArgs: { autoLogin: true },
        }
      );
      collectiviteId = collectivite.data.id;

      console.log(`Create discussions`);
      const createdDiscussionIds = await discussions.create(user, [
        {
          actionId: 'cae_1.1.1',
          collectiviteId: collectivite.data.id,
          message: 'Premier commentaire sur la mesure 1.1.1',
        },
        {
          actionId: 'cae_1.1.1',
          collectiviteId: collectivite.data.id,
          message: 'Deuxième commentaire sur la mesure 1.1.1',
        },
        {
          actionId: 'cae_1.1.1',
          collectiviteId: collectivite.data.id,
          message: 'Troisième commentaire sur la mesure 1.1.1',
        },
        {
          actionId: 'cae_1.1.1.2',
          collectiviteId: collectivite.data.id,
          message: 'Troisième commentaire sur la mesure 1.1.1',
        },
      ]);

      console.log('createdDiscussionIds', createdDiscussionIds);
    }
  );

  test('Ouvrir le panneau de discussion', async ({ discussionsPom }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);
    await discussionsPom.expectDiscussionPanelVisible();
  });

  test('Fermer un commentaire', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    await filterDiscussionsPom.closeFirstComment();
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - tous les commentaires', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    // Par défaut, seuls les commentaires ouverts sont affichés
    await filterDiscussionsPom.selectStatus('Tous les commentaires');
    // Le panneau doit rester visible avec tous les commentaires
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(4);
  });

  test('Filtrer par statut - commentaires ouverts', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    await filterDiscussionsPom.closeFirstComment();
    await filterDiscussionsPom.selectStatus('Commentaires ouverts');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - commentaires fermés', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    await filterDiscussionsPom.closeFirstComment();
    await filterDiscussionsPom.selectStatus('Commentaires fermés');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test('Filtrer par mesure', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    await filterDiscussionsPom.filterAction('1.1.1.2');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test('Ouverture du panneau de discussion sur un sous-action', async ({
    discussionsPom,
    filterDiscussionsPom,
  }) => {
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    await filterDiscussionsPom.clickOnSubAction('1.1.1.2');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test("Ouvrir l'onglet Commentaires", async ({ discussionsPom }) => {
    await discussionsPom.gotoCommentairesTab(collectiviteId, referentielId);
    await discussionsPom.expectCommentairesTabVisible();
  });
});
