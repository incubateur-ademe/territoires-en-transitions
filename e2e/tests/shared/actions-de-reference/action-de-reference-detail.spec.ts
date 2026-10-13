import { expect } from '@playwright/test';
import { Levier, LEVIER_NOM_BY_ID } from '@tet/domain/shared';
import { PriorisationLeviersPom } from 'tests/collectivite/priorisation-leviers/priorisation-leviers.pom';
import {
  testWithActionsDeReference as test,
  toRunToken,
  withRunSuffix,
} from './actions-de-reference.fixture';

const LEVIER_NOM: Levier = LEVIER_NOM_BY_ID.covoiturage;

const toCovoiturageAction = (runToken: string) => ({
  titre: withRunSuffix('Aménager des aires de covoiturage', runToken),
  description: 'Créer des points de rencontre pour les covoitureurs.',
  levier: 'covoiturage' as const,
  categorie: 'amenagement' as const,
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

test.describe('ca-m-interesse', () => {
  test("le bouton s'enfonce au clic, reste enfoncé après rechargement et se relâche au second clic", async ({
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
    const { interestedButton } = actionDeReferenceDetailPom;
    await expect(interestedButton).toHaveAttribute('aria-pressed', 'false');

    await interestedButton.click();
    await expect(interestedButton).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expect(interestedButton).toHaveAttribute('aria-pressed', 'true');

    await interestedButton.click();
    await expect(interestedButton).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('ca-m-interesse-et-priorisation', () => {
  test("une action marquée « Ça m'intéresse » sur sa page est dans la présélection de la priorisation", async ({
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
    const priorisationPom = new PriorisationLeviersPom(page);
    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });

    await actionDeReferenceDetailPom.interestedButton.click();
    await expect(actionDeReferenceDetailPom.interestedButton).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await priorisationPom.goto(collectivite.data.id);

    await expect(priorisationPom.preselectionLink).toHaveText(
      'Voir mon action sauvegardée'
    );
    await priorisationPom.openPreselection();
    await expect(priorisationPom.preselectedCard(action.titre)).toBeVisible();
  });

  test("une action ajoutée à la présélection depuis la priorisation a son bouton « Ça m'intéresse » enfoncé sur sa page", async ({
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
    const priorisationPom = new PriorisationLeviersPom(page);
    await priorisationPom.goto(collectivite.data.id);
    await priorisationPom.openLevier(LEVIER_NOM);
    const card = priorisationPom.actionCardInPanel(LEVIER_NOM, action.titre);
    await card.getByRole('button', { name: 'Sauvegarder' }).click();
    await expect(card.getByRole('button', { name: 'Ajoutée' })).toBeVisible();

    await actionDeReferenceDetailPom.open({
      collectiviteId: collectivite.data.id,
      action,
    });

    await expect(actionDeReferenceDetailPom.interestedButton).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
