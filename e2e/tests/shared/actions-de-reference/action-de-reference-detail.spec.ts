import { expect } from '@playwright/test';
import {
  testWithActionsDeReference as test,
  toRunToken,
  withRunSuffix,
} from './actions-de-reference.fixture';

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
