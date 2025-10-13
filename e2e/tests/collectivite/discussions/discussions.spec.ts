import { testWithUsers as test } from '../../users/users.fixture';
import { DiscussionsPom } from './discussions.pom';
import { FilterDiscussionsPom } from './filter-discussions.pom';

test.describe('Discussions', () => {
  let collectiviteId: number;
  const referentielId = 'cae';
  const actionId = 'cae_1.1.1';

  test.beforeEach(async ({ page, users }) => {
    const { user, collectivite } = await users.addCollectiviteAndUserWithLogin(
      page.context()
    );
    collectiviteId = collectivite.data.id;

    console.log(`Create discussions`);
    const createdDiscussionIds = await user.createDiscussions([
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
  });

  test('Ouvrir le panneau de discussion', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);
    await discussionsPom.expectDiscussionPanelVisible();
  });

  test('Fermer un commentaire', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);

    await filterDiscussionsPom.closeFirstComment();
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - tous les commentaires', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    // Par défaut, seuls les commentaires ouverts sont affichés
    await filterDiscussionsPom.selectStatus('Tous les commentaires');
    // Le panneau doit rester visible avec tous les commentaires
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(4);
  });

  test('Filtrer par statut - commentaires ouverts', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    await filterDiscussionsPom.closeFirstComment();
    await filterDiscussionsPom.selectStatus('Commentaires ouverts');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - commentaires fermés', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    await filterDiscussionsPom.closeFirstComment();
    await filterDiscussionsPom.selectStatus('Commentaires fermés');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test('Filtrer par mesure', async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    await filterDiscussionsPom.filterAction('1.1.1.2');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test('Ouverture du panneau de discussion sur un sous-action', async ({
    page,
  }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionsPom = new FilterDiscussionsPom(page);
    await filterDiscussionsPom.clickOnSubAction('1.1.1.2');
    await discussionsPom.expectDiscussionPanelVisible();
    await discussionsPom.expectedDiscussionCount(1);
  });

  test("Ouvrir l'onglet Commentaires", async ({ page }) => {
    const discussionsPom = new DiscussionsPom(page);
    await discussionsPom.gotoCommentairesTab(collectiviteId, referentielId);
    await discussionsPom.expectCommentairesTabVisible();
  });
});
