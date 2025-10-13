import { testWithUsers as test } from '../../users/users.fixture';
import { DiscussionPom } from './discussion.pom';
import { FilterDiscussionPom } from './filter-discussion.pom';

test.describe('Discussion', () => {
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
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);
    await discussionPom.expectDiscussionPanelVisible();
  });

  test('Fermer un commentaire', async ({ page }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);

    await filterDiscussionPom.closeFirstComment();
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - tous les commentaires', async ({ page }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);
    // Par défaut, seuls les commentaires ouverts sont affichés
    await filterDiscussionPom.selectStatus('Tous les commentaires');
    // Le panneau doit rester visible avec tous les commentaires
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(4);
  });

  test('Filtrer par statut - commentaires ouverts', async ({ page }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);
    await filterDiscussionPom.closeFirstComment();
    await filterDiscussionPom.selectStatus('Commentaires ouverts');
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(3);
  });

  test('Filtrer par statut - commentaires fermés', async ({ page }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);
    await filterDiscussionPom.closeFirstComment();
    await filterDiscussionPom.selectStatus('Commentaires fermés');
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(1);
  });

  test('Filtrer par mesure', async ({ page }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);
    await filterDiscussionPom.filterAction('1.1.1.2');
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(1);
  });

  test('Ouverture du panneau de discussion sur un sous-action', async ({
    page,
  }) => {
    const discussionPom = new DiscussionPom(page);
    await discussionPom.goto(collectiviteId, referentielId, actionId);

    const filterDiscussionPom = new FilterDiscussionPom(page);
    await filterDiscussionPom.clickOnSubAction('1.1.1.2');
    await discussionPom.expectDiscussionPanelVisible();
    await discussionPom.expectedDiscussionCount(1);
  });
});
