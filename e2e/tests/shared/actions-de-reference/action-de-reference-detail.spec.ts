import { expect } from '@playwright/test';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { addMobilisationAvecFiche } from 'tests/collectivite/priorisation-leviers/priorisation-leviers.fixture';
import { PriorisationLeviersPom } from 'tests/collectivite/priorisation-leviers/priorisation-leviers.pom';
import {
  type NewActionDeReference,
  testWithActionsDeReference as test,
  toRunToken,
  withRunSuffix,
} from './actions-de-reference.fixture';

const LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.covoiturage;

const toCovoiturageAction = (runToken: string): NewActionDeReference => ({
  titre: withRunSuffix('Aménager des aires de covoiturage', runToken),
  description: 'Créer des points de rencontre pour les covoitureurs.',
  leviers: ['covoiturage'],
  categories: ['amenagement'],
});

test.describe('linked-fiches', () => {
  test("un utilisateur d'une autre collectivité voit une fiche liée et l'ouvre", async ({
    actionsDeReference,
    collectivites,
    fiches,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const runToken = toRunToken();
    const ficheTitre = withRunSuffix('Tiers-financement', runToken);
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(runToken),
    ]);
    const { collectivite: ownerCollectivite, user: ownerUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const [ficheId] = await fiches.create(ownerUser, [
      {
        collectiviteId: ownerCollectivite.data.id,
        titre: ficheTitre,
        restreint: false,
      },
    ]);
    await actionsDeReference.linkFiches({
      actionDeReferenceId: action.id,
      ficheIds: [ficheId],
    });
    const { collectivite: viewerCollectivite } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });

    await actionDeReferenceDetailPom.open({
      collectiviteId: viewerCollectivite.data.id,
      action,
    });
    await actionDeReferenceDetailPom
      .linkedFiche(ficheTitre)
      .getByRole('link')
      .click();

    await expect(page).toHaveURL(
      new RegExp(
        `/collectivite/${ownerCollectivite.data.id}/actions/${ficheId}`
      )
    );
  });

  test('une fiche restreinte liée est montrée sans lien vers sa page', async ({
    actionsDeReference,
    collectivites,
    fiches,
    actionDeReferenceDetailPom,
  }) => {
    const runToken = toRunToken();
    const ficheTitre = withRunSuffix('Fiche confidentielle', runToken);
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(runToken),
    ]);
    const { collectivite: ownerCollectivite, user: ownerUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const [ficheId] = await fiches.create(ownerUser, [
      {
        collectiviteId: ownerCollectivite.data.id,
        titre: ficheTitre,
        restreint: true,
      },
    ]);
    await actionsDeReference.linkFiches({
      actionDeReferenceId: action.id,
      ficheIds: [ficheId],
    });
    const { collectivite: viewerCollectivite } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });

    await actionDeReferenceDetailPom.open({
      collectiviteId: viewerCollectivite.data.id,
      action,
    });

    const linkedFiche = actionDeReferenceDetailPom.linkedFiche(ficheTitre);
    await expect(linkedFiche).toBeVisible();
    await expect(linkedFiche.getByRole('link')).toHaveCount(0);
  });

  test('les fiches de la collectivité courante ne sont pas listées, seulement celles des autres', async ({
    actionsDeReference,
    collectivites,
    fiches,
    actionDeReferenceDetailPom,
  }) => {
    const runToken = toRunToken();
    const otherFicheTitre = withRunSuffix(
      "Fiche d'une autre collectivité",
      runToken
    );
    const ownFicheTitre = withRunSuffix('Fiche de ma collectivité', runToken);
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(runToken),
    ]);
    const { collectivite: otherCollectivite, user: otherUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const [otherFicheId] = await fiches.create(otherUser, [
      {
        collectiviteId: otherCollectivite.data.id,
        titre: otherFicheTitre,
        restreint: false,
      },
    ]);
    const { collectivite: ownCollectivite, user: ownUser } =
      await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
    const [ownFicheId] = await fiches.create(ownUser, [
      {
        collectiviteId: ownCollectivite.data.id,
        titre: ownFicheTitre,
        restreint: false,
      },
    ]);
    await actionsDeReference.linkFiches({
      actionDeReferenceId: action.id,
      ficheIds: [otherFicheId, ownFicheId],
    });

    await actionDeReferenceDetailPom.open({
      collectiviteId: ownCollectivite.data.id,
      action,
    });

    await expect(
      actionDeReferenceDetailPom.linkedFiche(otherFicheTitre)
    ).toBeVisible();
    await expect(
      actionDeReferenceDetailPom.linkedFiche(ownFicheTitre)
    ).toHaveCount(0);
  });

  test("une action sans fiche liée dit qu'aucune collectivité n'a partagé d'action", async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });

    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });

    await expect(
      actionDeReferenceDetailPom.noLinkedFichesMessage
    ).toBeVisible();
  });
});

test.describe('retour-a-la-page-d-origine', () => {
  test("depuis le catalogue, le fil d'Ariane revient au catalogue avec la recherche saisie", async ({
    actionsDeReference,
    collectivites,
    actionsDeReferencePom,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const runToken = toRunToken();
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(runToken),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id);
    await actionsDeReferencePom.searchField.fill(action.titre);
    await expect(page).toHaveURL(/searchedText=/);
    await expect(
      actionsDeReferencePom.cardTitlesContaining(runToken)
    ).toHaveText([action.titre]);
    await actionsDeReferencePom.cards
      .filter({ hasText: action.titre })
      .getByRole('link', { name: action.titre })
      .click();
    await expect(
      page.getByRole('heading', { level: 1, name: action.titre })
    ).toBeVisible();

    await actionDeReferenceDetailPom
      .backBreadcrumb('Actions de référence')
      .click();

    await expect(actionsDeReferencePom.title).toBeVisible();
    await expect(actionsDeReferencePom.searchField).toHaveValue(action.titre);
  });

  test("depuis la priorisation, le fil d'Ariane revient à l'aide à la priorisation", async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationPom = new PriorisationLeviersPom(page);
    await priorisationPom.goto(collectivite.data.id);
    await priorisationPom.openLevier(LEVIER_NOM);
    await priorisationPom
      .actionCardInPanel(LEVIER_NOM, action.titre)
      .getByRole('link', { name: action.titre })
      .click();
    await expect(
      page.getByRole('heading', { level: 1, name: action.titre })
    ).toBeVisible();

    await actionDeReferenceDetailPom
      .backBreadcrumb('Aide à la priorisation')
      .click();

    await expect(priorisationPom.title).toBeVisible();
  });

  test("depuis les actions sauvegardées, le fil d'Ariane revient aux actions sauvegardées", async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationPom = new PriorisationLeviersPom(page);
    await priorisationPom.goto(collectivite.data.id);
    await priorisationPom.openLevier(LEVIER_NOM);
    const card = priorisationPom.actionCardInPanel(LEVIER_NOM, action.titre);
    await card.getByRole('button', { name: 'Sauvegarder' }).click();
    await expect(
      card.getByRole('button', { name: 'Sauvegardé' })
    ).toBeVisible();
    await priorisationPom.openPreselection();
    await priorisationPom
      .preselectedCard(action.titre)
      .getByRole('link', { name: action.titre })
      .click();
    await expect(
      page.getByRole('heading', { level: 1, name: action.titre })
    ).toBeVisible();

    await actionDeReferenceDetailPom
      .backBreadcrumb('Mes actions sauvegardées')
      .click();

    await expect(priorisationPom.preselectionTitle).toBeVisible();
  });

  test("une origine externe est ignorée : le fil d'Ariane revient au catalogue", async ({
    actionsDeReference,
    collectivites,
    actionsDeReferencePom,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    const externalOrigin = encodeURIComponent(
      'https://example.org/priorisation'
    );
    await page.goto(
      `${actionDeReferenceDetailPom.url({
        collectiviteId: collectivite.data.id,
        actionDeReferenceId: action.id,
      })}?from=${externalOrigin}`
    );
    await expect(
      page.getByRole('heading', { level: 1, name: action.titre })
    ).toBeVisible();

    await actionDeReferenceDetailPom
      .backBreadcrumb('Actions de référence')
      .click();

    await expect(actionsDeReferencePom.title).toBeVisible();
    await expect(page).toHaveURL(
      (url) => url.pathname === actionsDeReferencePom.url(collectivite.data.id)
    );
  });
});

test.describe('sauvegarde', () => {
  test('« Sauvegarder » devient « Sauvegardé » au clic, le reste après rechargement et redevient « Sauvegarder » au second clic', async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });
    const { saveButton, savedButton } = actionDeReferenceDetailPom;
    await expect(saveButton).toBeVisible();

    await saveButton.click();
    await expect(savedButton).toBeVisible();

    await page.reload();
    await expect(savedButton).toBeVisible();

    await savedButton.click();
    await expect(saveButton).toBeVisible();
  });
});

test.describe('sauvegarde-et-priorisation', () => {
  test('une action marquée « Sauvegarder » sur sa page est dans la présélection de la priorisation', async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationPom = new PriorisationLeviersPom(page);
    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });

    await actionDeReferenceDetailPom.saveButton.click();
    await expect(actionDeReferenceDetailPom.savedButton).toBeVisible();
    await priorisationPom.goto(collectivite.data.id);

    await expect(
      priorisationPom.metricCount(/^actions? sauvegardées?$/)
    ).toHaveText('1');
    await priorisationPom.openPreselection();
    await expect(priorisationPom.preselectedCard(action.titre)).toBeVisible();
  });

  test('une action ajoutée à la présélection depuis la priorisation affiche « Sauvegardé » sur sa page', async ({
    actionsDeReference,
    collectivites,
    actionDeReferenceDetailPom,
    page,
  }) => {
    const [action] = await actionsDeReference.add([
      toCovoiturageAction(toRunToken()),
    ]);
    const { collectivite } = await collectivites.addCollectiviteAndUser({
      userArgs: { autoLogin: true },
    });
    await addMobilisationAvecFiche(collectivite.data.id);
    const priorisationPom = new PriorisationLeviersPom(page);
    await priorisationPom.goto(collectivite.data.id);
    await priorisationPom.openLevier(LEVIER_NOM);
    const card = priorisationPom.actionCardInPanel(LEVIER_NOM, action.titre);
    await card.getByRole('button', { name: 'Sauvegarder' }).click();
    await expect(
      card.getByRole('button', { name: 'Sauvegardé' })
    ).toBeVisible();

    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });

    await expect(actionDeReferenceDetailPom.savedButton).toBeVisible();
  });
});
