import { expect } from '@playwright/test';
import { pickFreeRegionCode } from '@tet/backend/demarches/pcaet/demarches-pcaet.test-fixture';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { CollectiviteRole } from '@tet/domain/users';
import { databaseService } from 'tests/shared/database.service';
import {
  openUpdatePanelAsSuperAdmin,
  testWithActionsDeReference as test,
  withRunSuffix,
} from './actions-de-reference.fixture';

const toBeAutomated = async (): Promise<void> => undefined;

test.describe('rechercher-actions', () => {
  test.fixme(
    'un utilisateur connecté ne voit que les actions dont le titre ou la description contient le texte cherché',
    async () => {
      await test.step(
        'Given : trois actions de référence existent, « Isoler les combles perdus » (titre), « Rénover les écoles » (description « isolation des COMBLES ») et « Aménager des aires de covoiturage »',
        toBeAutomated
      );
      await test.step(
        'Given : un utilisateur connecté ouvre /collectivite/:id/actions-reference',
        toBeAutomated
      );
      await test.step(
        'When : il saisit « combles » dans le champ de recherche nommé « Rechercher une action de référence »',
        toBeAutomated
      );
      await test.step(
        'Then : les cards « Isoler les combles perdus » et « Rénover les écoles » sont visibles',
        toBeAutomated
      );
      await test.step(
        'Then : la card « Aménager des aires de covoiturage » est absent',
        toBeAutomated
      );
    }
  );

  test.fixme('la recherche ignore les accents', async () => {
    await test.step(
      'Given : une action de référence « Développer les réseaux de chaleur » existe',
      toBeAutomated
    );
    await test.step(
      "When : l'utilisateur saisit « reseaux » dans le champ de recherche nommé « Rechercher une action de référence »",
      toBeAutomated
    );
    await test.step(
      'Then : la card « Développer les réseaux de chaleur » est visible',
      toBeAutomated
    );
  });
});

test.describe('filtrer-leviers-categories', () => {
  test.fixme(
    "plusieurs leviers et plusieurs catégories choisis montrent les actions qui portent l'un des leviers ou l'une des catégories",
    async () => {
      await test.step(
        'Given : quatre actions existent, une sur le levier « Covoiturage », une sur le levier « Gestion des haies », une de catégorie « Financement & fiscalité » sur un autre levier, une sans aucun des trois',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur choisit « Covoiturage » et « Gestion des haies » dans la liste nommée « Leviers »",
        toBeAutomated
      );
      await test.step(
        'When : il choisit « Financement & fiscalité » dans la liste nommée « Catégories »',
        toBeAutomated
      );
      await test.step(
        'Then : les trois premières actions sont visibles et la quatrième est absente',
        toBeAutomated
      );
    }
  );

  test.fixme('le filtre se combine en ET avec le texte cherché', async () => {
    await test.step(
      'Given : deux actions portent le levier « Covoiturage », une seule contient « aires » dans son titre',
      toBeAutomated
    );
    await test.step(
      "When : l'utilisateur choisit « Covoiturage » dans la liste nommée « Leviers » et saisit « aires » dans le champ de recherche",
      toBeAutomated
    );
    await test.step(
      "Then : seule l'action dont le titre contient « aires » est visible",
      toBeAutomated
    );
  });
});

test.describe('trier-actions', () => {
  test.fixme("la vue est triée par titre croissant à l'ouverture", async () => {
    await test.step(
      'Given : trois actions de titres « Végétaliser », « Aménager », « Isoler » existent',
      toBeAutomated
    );
    await test.step(
      "When : l'utilisateur ouvre la vue des actions de référence",
      toBeAutomated
    );
    await test.step(
      "Then : la liste nommée « Tri » affiche « Titre » et les cards se suivent dans l'ordre « Aménager », « Isoler », « Végétaliser »",
      toBeAutomated
    );
  });

  test.fixme(
    "le tri par levier puis par catégorie réordonne les actions dans l'ordre renvoyé par l'API",
    async () => {
      await test.step(
        'Given : trois actions sur des leviers et des catégories différents existent',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur choisit « Levier » dans la liste nommée « Tri »",
        toBeAutomated
      );
      await test.step(
        "Then : les cards se suivent dans l'ordre renvoyé par shared.actionsDeReference.list triée par levier",
        toBeAutomated
      );
      await test.step(
        'When : il choisit « Catégorie » dans la liste nommée « Tri »',
        toBeAutomated
      );
      await test.step(
        "Then : les cards se suivent dans l'ordre renvoyé par shared.actionsDeReference.list triée par catégorie",
        toBeAutomated
      );
    }
  );
});

test.describe('aucune-action-trouvee', () => {
  test.fixme(
    "une recherche sans résultat montre l'état vide, et « Effacer les filtres » ramène la liste complète",
    async () => {
      await test.step(
        'Given : des actions de référence existent, aucune ne contient « zzzz »',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur choisit « Levier » dans la liste nommée « Tri », un levier dans « Leviers » et saisit « zzzz » dans le champ de recherche",
        toBeAutomated
      );
      await test.step(
        'Then : le texte « Aucune action de référence ne correspond à votre recherche » et le bouton « Effacer les filtres » sont visibles',
        toBeAutomated
      );
      await test.step(
        'When : il clique le bouton « Effacer les filtres »',
        toBeAutomated
      );
      await test.step(
        "Then : le champ de recherche est vide, aucun levier n'est choisi, la liste « Tri » affiche « Titre », l'URL ne porte plus aucun paramètre et toutes les actions sont visibles",
        toBeAutomated
      );
    }
  );
});

test.describe('aucune-action-en-base', () => {
  test(
    "sans aucune action en base ni filtre actif, le même état vide s'affiche avec son bouton",
    { tag: '@serial' },
    async ({ collectivites, actionsDeReference, actionsDeReferencePom }) => {
      const { collectivite } =
        await test.step("Given : aucune action de référence n'existe", async () => {
          await actionsDeReference.removeAll();
          return collectivites.addCollectiviteAndUser({
            userArgs: { autoLogin: true },
          });
        });
      await test.step("When : l'utilisateur ouvre la vue des actions de référence sans paramètre", () =>
        actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
      await test.step('Then : le texte « Aucune action de référence ne correspond à votre recherche » et le bouton « Effacer les filtres » sont visibles', async () => {
        await expect(actionsDeReferencePom.emptyStateMessage).toBeVisible();
        await expect(actionsDeReferencePom.resetFiltersButton).toBeVisible();
        await expect(actionsDeReferencePom.cards).toHaveCount(0);
      });
    }
  );
});

test.describe('card-affiche-action-entiere', () => {
  test('une card montre le titre, la description entière, le levier et la catégorie', async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const titre = withRunSuffix('Planter des haies bocagères');
    const paragraphes = [
      'Recenser avec les agriculteurs les linéaires de haies à conforter ou à recréer.',
      "Financer la plantation de haies d'essences locales en bordure de parcelles.",
      'Former les exploitants à la taille douce et à la valorisation du bois produit.',
      'Suivre chaque année les mètres plantés et la reprise des jeunes plants.',
    ] as const;
    const description = paragraphes.join('\n\n');

    const { collectivite } =
      await test.step('Given : une action « Planter des haies bocagères » existe, description de quatre paragraphes, levier « Gestion des haies », catégorie « Financement & fiscalité »', async () => {
        await actionsDeReference.add([
          {
            titre,
            description,
            levier: 'gestion_haies',
            categorie: 'financement',
          },
        ]);
        return collectivites.addCollectiviteAndUser({
          userArgs: { autoLogin: true },
        });
      });
    await test.step("When : l'utilisateur ouvre la vue des actions de référence", () =>
      actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
    await test.step('Then : la card « Planter des haies bocagères » contient le titre, les quatre paragraphes de la description, « Gestion des haies » et « Financement & fiscalité »', async () => {
      const card = actionsDeReferencePom.card(titre);
      await expect(card).toBeVisible();
      const descriptionText = card.getByText(paragraphes[0], { exact: false });
      await expect(descriptionText).toHaveJSProperty('innerText', description);
      await expect(card).toContainText('Gestion des haies');
      await expect(card).toContainText('Financement & fiscalité');
    });
  });
});

test.describe('liste-en-chargement', () => {
  test("un indicateur de chargement remplace les cards tant que la liste n'est pas arrivée", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const titre = withRunSuffix(
      'Action de référence e2e affichée après le chargement'
    );

    const { collectivite, heldListResponses } =
      await test.step('Given : la réponse de shared.actionsDeReference.list est retenue par page.route', async () => {
        await actionsDeReference.add([
          {
            titre,
            description: 'Action insérée pour le parcours de chargement.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        const { collectivite } = await collectivites.addCollectiviteAndUser({
          userArgs: { autoLogin: true },
        });
        return {
          collectivite,
          heldListResponses: await actionsDeReferencePom.holdListResponses(),
        };
      });
    await test.step("When : l'utilisateur ouvre la vue des actions de référence", () =>
      actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
    await test.step("Then : un élément de rôle status est visible et aucune card n'est affichée", async () => {
      await expect(actionsDeReferencePom.loadingStatus).toBeVisible();
      await expect(actionsDeReferencePom.cards).toHaveCount(0);
    });
    await test.step('When : la réponse est relâchée', () =>
      heldListResponses.release());
    await test.step("Then : l'élément de rôle status disparaît et les cards sont visibles", async () => {
      await expect(actionsDeReferencePom.loadingStatus).toBeHidden();
      await expect(actionsDeReferencePom.card(titre)).toBeVisible();
    });
  });
});

test.describe('liste-en-erreur', () => {
  test("une erreur de l'API montre un état d'erreur, et « Réessayer » recharge la liste", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const titre = withRunSuffix(
      'Action de référence e2e affichée après une erreur'
    );

    const { collectivite } =
      await test.step('Given : shared.actionsDeReference.list répond 500 par page.route', async () => {
        await actionsDeReference.add([
          {
            titre,
            description: "Action insérée pour le parcours d'erreur.",
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        await actionsDeReferencePom.failListResponses();
        return collectivites.addCollectiviteAndUser({
          userArgs: { autoLogin: true },
        });
      });
    await test.step("When : l'utilisateur ouvre la vue des actions de référence", () =>
      actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
    await test.step("Then : la carte d'erreur et le bouton « Réessayer » sont visibles, aucune card n'est affichée", async () => {
      await expect(actionsDeReferencePom.errorTitle).toBeVisible();
      await expect(actionsDeReferencePom.retryButton).toBeVisible();
      await expect(actionsDeReferencePom.cards).toHaveCount(0);
    });
    await test.step("When : la route n'est plus interceptée et il clique le bouton « Réessayer »", async () => {
      await actionsDeReferencePom.stopFailingListResponses();
      await actionsDeReferencePom.retryButton.click();
    });
    await test.step('Then : les cards sont visibles', async () => {
      await expect(actionsDeReferencePom.card(titre)).toBeVisible();
      await expect(actionsDeReferencePom.errorTitle).toBeHidden();
    });
  });
});

test.describe('recherche-partageable-par-url', () => {
  test.fixme(
    'recharger la page garde le texte, les leviers, les catégories, le tri et les résultats',
    async () => {
      await test.step(
        "Given : l'utilisateur a saisi « combles », choisi un levier, une catégorie et le tri « Levier »",
        toBeAutomated
      );
      await test.step(
        "Then : l'URL porte les paramètres searchedText, leviers, categories et sortBy",
        toBeAutomated
      );
      await test.step('When : il recharge la page', toBeAutomated);
      await test.step(
        'Then : le champ de recherche affiche « combles », le levier et la catégorie restent choisis, la liste « Tri » affiche « Levier » et les mêmes cards sont visibles',
        toBeAutomated
      );
    }
  );

  test.fixme(
    'la même URL ouverte dans un autre onglet montre la même recherche',
    async () => {
      await test.step(
        "Given : l'URL d'une recherche avec texte, levier, catégorie et tri",
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur ouvre cette URL dans une nouvelle page du même contexte",
        toBeAutomated
      );
      await test.step(
        'Then : les champs et les cards sont identiques à ceux de la première page',
        toBeAutomated
      );
    }
  );
});

test.describe('filtre-url-inconnu-ignore', () => {
  test.fixme(
    "une valeur inconnue est ignorée, le reste est appliqué et l'URL est nettoyée",
    async () => {
      await test.step(
        "When : l'utilisateur ouvre /collectivite/:id/actions-reference?leviers=covoiturage,levier_inconnu&categories=subvention&sortBy=prix",
        toBeAutomated
      );
      await test.step(
        "Then : aucun message d'erreur n'est affiché",
        toBeAutomated
      );
      await test.step(
        "Then : « Covoiturage » est le seul levier choisi, aucune catégorie n'est choisie et la liste « Tri » affiche « Titre »",
        toBeAutomated
      );
      await test.step(
        "Then : l'URL devient /collectivite/:id/actions-reference?leviers=covoiturage",
        toBeAutomated
      );
    }
  );
});

test.describe('modification-reservee-super-admin', () => {
  test("un utilisateur connecté qui n'est pas super admin ne voit aucun bouton de modification", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const firstTitre = withRunSuffix(
      'Action de référence e2e en lecture seule A'
    );
    const secondTitre = withRunSuffix(
      'Action de référence e2e en lecture seule B'
    );

    const { collectivite } =
      await test.step('Given : un utilisateur connecté sans rôle super admin et deux actions de référence', async () => {
        await actionsDeReference.add([
          {
            titre: firstTitre,
            description: 'Première action insérée pour le parcours en lecture.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
          {
            titre: secondTitre,
            description: 'Seconde action insérée pour le parcours en lecture.',
            levier: 'gestion_haies',
            categorie: 'financement',
          },
        ]);
        return collectivites.addCollectiviteAndUser({
          userArgs: { autoLogin: true },
        });
      });
    await test.step('When : il ouvre la vue des actions de référence', () =>
      actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
    await test.step("Then : aucun bouton dont le nom commence par « Modifier l'action » n'est présent", async () => {
      await expect(actionsDeReferencePom.card(firstTitre)).toBeVisible();
      await expect(actionsDeReferencePom.card(secondTitre)).toBeVisible();
      await expect(actionsDeReferencePom.updateButtons).toHaveCount(0);
    });
  });

  test('un super admin voit un bouton de modification sur chaque card', async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const isolationTitre = withRunSuffix('Isoler les combles perdus');
    const covoiturageTitre = withRunSuffix('Aménager des aires de covoiturage');

    const { collectivite } =
      await test.step('Given : un super admin et deux actions de référence', async () => {
        await actionsDeReference.add([
          {
            titre: isolationTitre,
            description: 'Réduire les pertes de chaleur par la toiture.',
            levier: 'sobriete_batiments_residentiel',
            categorie: 'amenagement',
          },
          {
            titre: covoiturageTitre,
            description: 'Créer des points de rencontre pour les covoitureurs.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        return collectivites.addCollectiviteAndUser({
          userArgs: {
            autoLogin: true,
            isSupport: true,
            isSuperAdminRoleEnabled: true,
          },
        });
      });
    await test.step('When : il ouvre la vue des actions de référence', () =>
      actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id));
    await test.step("Then : chaque card porte un bouton « Modifier l'action « <titre> » »", async () => {
      await expect(
        actionsDeReferencePom.updateButton(isolationTitre)
      ).toBeVisible();
      await expect(
        actionsDeReferencePom.updateButton(covoiturageTitre)
      ).toBeVisible();
    });
  });
});

test.describe('modifier-action', () => {
  test("un super admin modifie les quatre champs d'une action, la liste se met à jour et un toast confirme", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const covoiturageTitre = withRunSuffix('Aménager des aires de covoiturage');
    const covoiturageDescription =
      'Créer des points de rencontre pour les covoitureurs.';
    const updatedTitre = withRunSuffix('Planter des haies bocagères');
    const updatedDescription = 'Replanter les linéaires de haies arrachés.';

    const { collectivite } =
      await test.step('Given : un super admin et une action « Aménager des aires de covoiturage »', async () => {
        await actionsDeReference.add([
          {
            titre: covoiturageTitre,
            description: covoiturageDescription,
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        return collectivites.addCollectiviteAndUser({
          userArgs: {
            autoLogin: true,
            isSupport: true,
            isSuperAdminRoleEnabled: true,
          },
        });
      });
    await test.step("When : il clique le bouton « Modifier l'action « Aménager des aires de covoiturage » »", async () => {
      await actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id);
      await actionsDeReferencePom.openUpdatePanel(covoiturageTitre);
    });
    await test.step("Then : le volet « Modifier l'action de référence » s'ouvre, ses champs « Titre », « Description », « Levier » et « Catégorie » sont préremplis", async () => {
      await expect(actionsDeReferencePom.titreField).toHaveValue(
        covoiturageTitre
      );
      await expect(actionsDeReferencePom.descriptionField).toHaveValue(
        covoiturageDescription
      );
      await expect(actionsDeReferencePom.levierSelect).toContainText(
        'Covoiturage'
      );
      await expect(actionsDeReferencePom.categorieSelect).toContainText(
        'Aménagement & infrastructures'
      );
    });
    await test.step('When : il change les quatre champs et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill(updatedTitre);
      await actionsDeReferencePom.descriptionField.fill(updatedDescription);
      await actionsDeReferencePom.chooseOption({
        select: actionsDeReferencePom.levierSelect,
        optionLabel: 'Gestion des haies',
      });
      await actionsDeReferencePom.chooseOption({
        select: actionsDeReferencePom.categorieSelect,
        optionLabel: 'Financement & fiscalité',
      });
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step('Then : le toast « Action de référence modifiée » est visible et le volet est fermé', async () => {
      await expect(
        actionsDeReferencePom.toast('Action de référence modifiée')
      ).toBeVisible();
      await expect(actionsDeReferencePom.updatePanel).toBeHidden();
    });
    await test.step('Then : la card affiche le nouveau titre, la nouvelle description, le nouveau levier et la nouvelle catégorie', async () => {
      const updatedCard = actionsDeReferencePom.card(updatedTitre);
      await expect(updatedCard).toBeVisible();
      await expect(updatedCard).toContainText(updatedDescription);
      await expect(updatedCard).toContainText('Gestion des haies');
      await expect(updatedCard).toContainText('Financement & fiscalité');
      await expect(actionsDeReferencePom.card(covoiturageTitre)).toHaveCount(0);
    });
  });
});

test.describe('modifier-action-conflit', () => {
  test("enregistrer un triplet levier, catégorie et titre déjà pris affiche le message d'action identique", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const actionATitre = withRunSuffix('Action A');
    const actionBTitre = withRunSuffix('Action B');
    const actionBDescription = 'Seconde action insérée pour le conflit.';

    const { collectivite } =
      await test.step('Given : un super admin et deux actions de même levier et même catégorie, « Action A » et « Action B »', async () => {
        await actionsDeReference.add([
          {
            titre: actionATitre,
            description: 'Première action insérée pour le conflit.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
          {
            titre: actionBTitre,
            description: actionBDescription,
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        return collectivites.addCollectiviteAndUser({
          userArgs: {
            autoLogin: true,
            isSupport: true,
            isSuperAdminRoleEnabled: true,
          },
        });
      });
    await test.step('When : il ouvre le volet de « Action B », saisit « Action A » dans le champ « Titre » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id);
      await actionsDeReferencePom.openUpdatePanel(actionBTitre);
      await actionsDeReferencePom.titreField.fill(actionATitre);
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step("Then : le toast d'erreur « Une action de référence identique existe déjà. » est visible", async () => {
      await expect(
        actionsDeReferencePom.toast(
          'Une action de référence identique existe déjà.'
        )
      ).toBeVisible();
    });
    await test.step('Then : le volet reste ouvert avec la saisie, et la card « Action B » est inchangée dans la liste', async () => {
      await expect(actionsDeReferencePom.updatePanel).toBeVisible();
      await expect(actionsDeReferencePom.titreField).toHaveValue(actionATitre);
      const actionBCard = actionsDeReferencePom.card(actionBTitre);
      await expect(actionBCard).toBeVisible();
      await expect(actionBCard).toContainText(actionBDescription);
      await expect(actionsDeReferencePom.card(actionATitre)).toHaveCount(1);
    });
  });
});

test.describe('modifier-action-validation', () => {
  test("un titre vide, un titre de 301 caractères ou une description vide bloquent l'enregistrement avant l'envoi", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const updateRequests =
      await test.step("Given : un super admin a ouvert le volet d'une action, les appels à shared.actionsDeReference.update sont comptés", async () => {
        await openUpdatePanelAsSuperAdmin({
          collectivites,
          actionsDeReference,
          actionsDeReferencePom,
          action: {
            titre: withRunSuffix('Action de référence e2e à valider'),
            description: 'Action insérée pour le parcours de validation.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        });
        return actionsDeReferencePom.countUpdateRequests();
      });
    await test.step('When : il vide le champ « Titre » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill('');
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step("Then : un message d'erreur est visible sous « Titre » et le focus revient sur « Titre »", async () => {
      await expect(actionsDeReferencePom.titreFieldBlock).toContainText(
        'Ce champ est obligatoire'
      );
      await expect(actionsDeReferencePom.titreField).toBeFocused();
    });
    await test.step('When : il saisit 301 caractères dans le champ « Titre » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill('a'.repeat(301));
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step("Then : un message d'erreur est visible sous « Titre » et le focus revient sur « Titre »", async () => {
      await expect(actionsDeReferencePom.titreFieldBlock).toContainText(
        '300 caractères maximum'
      );
      await expect(actionsDeReferencePom.titreField).toBeFocused();
    });
    await test.step('When : il saisit 300 caractères dans « Titre », vide le champ « Description » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill('a'.repeat(300));
      await actionsDeReferencePom.descriptionField.fill('');
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step("Then : un message d'erreur est visible sous « Description » et le focus revient sur « Description »", async () => {
      await expect(actionsDeReferencePom.titreFieldBlock).not.toContainText(
        '300 caractères maximum'
      );
      await expect(actionsDeReferencePom.descriptionFieldBlock).toContainText(
        'Ce champ est obligatoire'
      );
      await expect(actionsDeReferencePom.descriptionField).toBeFocused();
    });
    await test.step('When : il saisit un titre et une description valides et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill(
        withRunSuffix('Action de référence e2e validée')
      );
      await actionsDeReferencePom.descriptionField.fill(
        'Description valide saisie après les refus.'
      );
      await actionsDeReferencePom.saveAndWaitForUpdateResponse();
    });
    await test.step("Then : un seul appel à shared.actionsDeReference.update a été émis, celui de l'enregistrement valide", () => {
      expect(updateRequests.count()).toBe(1);
    });
  });
});

test.describe('modifier-action-en-erreur', () => {
  test("une erreur de l'API hors conflit affiche un toast d'erreur", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const typedTitre = withRunSuffix('Titre saisi avant une erreur');

    await test.step("Given : un super admin a ouvert le volet d'une action, shared.actionsDeReference.update répond 500 par page.route", async () => {
      await openUpdatePanelAsSuperAdmin({
        collectivites,
        actionsDeReference,
        actionsDeReferencePom,
        action: {
          titre: withRunSuffix('Action de référence e2e en échec'),
          description: "Action insérée pour le parcours d'erreur à l'envoi.",
          levier: 'covoiturage',
          categorie: 'amenagement',
        },
      });
      await actionsDeReferencePom.failUpdateResponses();
    });
    await test.step('When : il change le champ « Titre » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.titreField.fill(typedTitre);
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step("Then : le toast d'erreur « Erreur lors de l'enregistrement » est visible", async () => {
      await expect(
        actionsDeReferencePom.toast("Erreur lors de l'enregistrement")
      ).toBeVisible();
    });
    await test.step('Then : le volet reste ouvert avec la saisie', async () => {
      await expect(actionsDeReferencePom.updatePanel).toBeVisible();
      await expect(actionsDeReferencePom.titreField).toHaveValue(typedTitre);
    });
  });
});

test.describe('fermer-volet-modifications-non-enregistrees', () => {
  test('fermer le volet avec une saisie non enregistrée demande confirmation, et poursuivre garde la saisie', async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const typedTitre = withRunSuffix('Titre saisi puis poursuivi');

    await test.step("Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »", async () => {
      await openUpdatePanelAsSuperAdmin({
        collectivites,
        actionsDeReference,
        actionsDeReferencePom,
        action: {
          titre: withRunSuffix('Action de référence e2e à poursuivre'),
          description: 'Action insérée pour le parcours de poursuite.',
          levier: 'covoiturage',
          categorie: 'amenagement',
        },
      });
      await actionsDeReferencePom.titreField.fill(typedTitre);
    });
    await test.step('When : il clique le bouton « Fermer » du volet', () =>
      actionsDeReferencePom.closePanelButton.click());
    await test.step('Then : la boîte de dialogue « Modifications non enregistrées » est visible', async () => {
      await expect(actionsDeReferencePom.discardChangesDialog).toBeVisible();
    });
    await test.step('When : il clique le bouton « Poursuivre la modification »', () =>
      actionsDeReferencePom.keepEditingButton.click());
    await test.step('Then : la boîte de dialogue est fermée, le volet est ouvert et le champ « Titre » porte la saisie', async () => {
      await expect(actionsDeReferencePom.discardChangesDialog).toBeHidden();
      await expect(actionsDeReferencePom.updatePanel).toBeVisible();
      await expect(actionsDeReferencePom.titreField).toHaveValue(typedTitre);
    });
  });

  test('confirmer la fermeture abandonne la saisie', async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const titre = withRunSuffix('Action de référence e2e à abandonner');
    const typedTitre = withRunSuffix('Titre saisi puis abandonné');

    await test.step("Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »", async () => {
      await openUpdatePanelAsSuperAdmin({
        collectivites,
        actionsDeReference,
        actionsDeReferencePom,
        action: {
          titre,
          description: "Action insérée pour le parcours d'abandon.",
          levier: 'covoiturage',
          categorie: 'amenagement',
        },
      });
      await actionsDeReferencePom.titreField.fill(typedTitre);
    });
    await test.step('When : il clique le bouton « Fermer » du volet puis le bouton « Fermer sans enregistrer »', async () => {
      await actionsDeReferencePom.closePanelButton.click();
      await actionsDeReferencePom.discardChangesButton.click();
    });
    await test.step("Then : le volet est fermé et la card affiche son titre d'origine", async () => {
      await expect(actionsDeReferencePom.updatePanel).toBeHidden();
      await expect(actionsDeReferencePom.discardChangesDialog).toBeHidden();
      await expect(actionsDeReferencePom.card(titre)).toBeVisible();
      await expect(actionsDeReferencePom.card(typedTitre)).toHaveCount(0);
    });
    await test.step('When : il rouvre le volet de la même action', () =>
      actionsDeReferencePom.openUpdatePanel(titre));
    await test.step("Then : le champ « Titre » porte le titre d'origine", async () => {
      await expect(actionsDeReferencePom.titreField).toHaveValue(titre);
    });
  });

  test('fermer le volet sans avoir rien changé ne demande aucune confirmation', async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    await test.step("Given : un super admin a ouvert le volet d'une action sans rien changer", () =>
      openUpdatePanelAsSuperAdmin({
        collectivites,
        actionsDeReference,
        actionsDeReferencePom,
        action: {
          titre: withRunSuffix('Action de référence e2e fermée sans saisie'),
          description: 'Action insérée pour le parcours de fermeture directe.',
          levier: 'covoiturage',
          categorie: 'amenagement',
        },
      }));
    await test.step('When : il clique le bouton « Fermer » du volet', () =>
      actionsDeReferencePom.closePanelButton.click());
    await test.step("Then : le volet est fermé et aucune boîte de dialogue ne s'est ouverte", async () => {
      await expect(actionsDeReferencePom.updatePanel).toBeHidden();
      await expect(actionsDeReferencePom.discardChangesDialog).toHaveCount(0);
    });
  });

  test('quitter la page avec une saisie non enregistrée ferme le volet sans confirmation', async ({
    page,
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const collectiviteId =
      await test.step("Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »", async () => {
        const openedCollectiviteId = await openUpdatePanelAsSuperAdmin({
          collectivites,
          actionsDeReference,
          actionsDeReferencePom,
          action: {
            titre: withRunSuffix('Action de référence e2e quittée'),
            description: 'Action insérée pour le parcours de sortie de page.',
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        });
        await actionsDeReferencePom.titreField.fill(
          withRunSuffix('Titre saisi avant de quitter')
        );
        return openedCollectiviteId;
      });
    await test.step('When : il clique un autre lien de la navigation', () =>
      actionsDeReferencePom.leaveThroughIndicateursNav());
    await test.step("Then : la page change, aucune boîte de dialogue ne s'ouvre", async () => {
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
          actionsDeReferencePom.indicateursListUrl(collectiviteId)
      );
      await expect(actionsDeReferencePom.updatePanel).toBeHidden();
      await expect(actionsDeReferencePom.discardChangesDialog).toHaveCount(0);
    });
  });
});

test.describe('action-modifiee-sort-des-filtres', () => {
  test('une action dont le levier change disparaît de la liste filtrée sur son ancien levier', async ({
    page,
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const covoiturageTitre = withRunSuffix('Aménager des aires de covoiturage');
    const pageLoadsAfterFiltering: string[] = [];

    await test.step('Given : un super admin a choisi « Covoiturage » dans la liste « Leviers », la card « Aménager des aires de covoiturage » est visible', async () => {
      await actionsDeReference.add([
        {
          titre: covoiturageTitre,
          description: 'Créer des points de rencontre pour les covoitureurs.',
          levier: 'covoiturage',
          categorie: 'amenagement',
        },
      ]);
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: {
          autoLogin: true,
          isSupport: true,
          isSuperAdminRoleEnabled: true,
        },
      });
      await actionsDeReferencePom.openAndWaitForTitle(collectivite.data.id);
      await actionsDeReferencePom.chooseLevierFilter('Covoiturage');
      await expect(page).toHaveURL(/leviers=covoiturage/);
      await expect(actionsDeReferencePom.card(covoiturageTitre)).toBeVisible();
      page.on('load', () => pageLoadsAfterFiltering.push(page.url()));
    });
    await test.step('When : il ouvre le volet de cette action, choisit « Gestion des haies » dans le champ « Levier » et clique le bouton « Enregistrer »', async () => {
      await actionsDeReferencePom.openUpdatePanel(covoiturageTitre);
      await actionsDeReferencePom.chooseOption({
        select: actionsDeReferencePom.levierSelect,
        optionLabel: 'Gestion des haies',
      });
      await actionsDeReferencePom.saveButton.click();
    });
    await test.step('Then : la card « Aménager des aires de covoiturage » disparaît de la liste sans rechargement de la page', async () => {
      await expect(actionsDeReferencePom.updatePanel).toBeHidden();
      await expect(actionsDeReferencePom.card(covoiturageTitre)).toHaveCount(0);
      expect(pageLoadsAfterFiltering).toEqual([]);
    });
    await test.step('Then : « Covoiturage » reste le levier choisi dans la liste « Leviers »', async () => {
      await expect(actionsDeReferencePom.leviersFilter).toContainText(
        'Covoiturage'
      );
      await expect(page).toHaveURL(/leviers=covoiturage/);
    });
  });
});

test.describe('entree-nav-reservee-au-super-admin', () => {
  test("un super admin a l'entrée « Actions de référence » à la racine de la navigation, qui mène à la vue", async ({
    collectivites,
    actionsDeReferencePom,
    page,
  }) => {
    const { collectivite } =
      await test.step("Given : un super admin, membre d'une collectivité standard, est sur le tableau de bord de sa collectivité", async () => {
        const collectiviteAndUser = await collectivites.addCollectiviteAndUser({
          userArgs: {
            autoLogin: true,
            isSupport: true,
            isSuperAdminRoleEnabled: true,
          },
        });
        await page.goto(
          actionsDeReferencePom.dashboardUrl(
            collectiviteAndUser.collectivite.data.id
          )
        );
        return collectiviteAndUser;
      });
    await test.step('When : il clique le lien « Actions de référence » de la navigation principale', () =>
      actionsDeReferencePom.navEntry.click());
    await test.step("Then : l'URL est /collectivite/:id/actions-reference et le titre de page « Actions de référence » est visible", async () => {
      await expect(page).toHaveURL(
        (url) =>
          url.pathname === actionsDeReferencePom.url(collectivite.data.id)
      );
      await expect(actionsDeReferencePom.title).toBeVisible();
    });
  });

  test("un utilisateur qui n'est pas super admin n'a pas l'entrée « Actions de référence » dans la navigation", async ({
    collectivites,
    actionsDeReferencePom,
    page,
  }) => {
    await test.step("Given : un utilisateur connecté sans rôle super admin, membre d'une collectivité standard, est sur le tableau de bord de sa collectivité", async () => {
      const { collectivite } = await collectivites.addCollectiviteAndUser({
        userArgs: { autoLogin: true },
      });
      await page.goto(actionsDeReferencePom.dashboardUrl(collectivite.data.id));
    });
    await test.step('When : la navigation principale est affichée', async () => {
      await expect(actionsDeReferencePom.indicateursNavEntry).toBeVisible();
    });
    await test.step("Then : aucun lien « Actions de référence » n'est présent", async () => {
      await expect(actionsDeReferencePom.navEntry).toHaveCount(0);
    });
  });
});

test.describe('page-accessible-par-url-en-prod', () => {
  test("la page s'affiche par son URL directe pour un utilisateur connecté", async ({
    collectivites,
    actionsDeReference,
    actionsDeReferencePom,
  }) => {
    const titre = withRunSuffix(
      'Action de référence e2e visible hors collectivité'
    );

    const targetCollectivite =
      await test.step('Given : un utilisateur connecté, non membre de la collectivité visée', async () => {
        await actionsDeReference.add([
          {
            titre,
            description: "Action insérée pour le parcours d'accès par URL.",
            levier: 'covoiturage',
            categorie: 'amenagement',
          },
        ]);
        await collectivites.addCollectiviteAndUser({
          userArgs: { autoLogin: true },
        });
        return collectivites.addCollectivite({});
      });
    await test.step('When : il ouvre directement /collectivite/:id/actions-reference', () =>
      actionsDeReferencePom.open(targetCollectivite.data.id));
    await test.step('Then : le titre de page « Actions de référence » et les cards sont visibles', async () => {
      await expect(actionsDeReferencePom.title).toBeVisible();
      await expect(actionsDeReferencePom.card(titre)).toBeVisible();
    });
  });

  test("la page s'affiche aussi dans le contexte d'un service déconcentré", async ({
    collectivites,
    actionsDeReferencePom,
    page,
  }) => {
    const { collectivite: dreal } =
      await test.step("Given : un utilisateur connecté, membre d'une DREAL", async () =>
        collectivites.addCollectiviteAndUser({
          collectiviteArgs: {
            type: collectiviteTypeEnum.DREAL,
            regionCode: await pickFreeRegionCode(
              databaseService,
              collectiviteTypeEnum.DREAL
            ),
            nom: 'DREAL e2e actions de référence',
          },
          userArgs: { role: CollectiviteRole.ADMIN, autoLogin: true },
        }));
    const drealPageResponse =
      await test.step('When : il ouvre directement /collectivite/:idDreal/actions-reference', () =>
        page.goto(actionsDeReferencePom.url(dreal.data.id)));
    await test.step('Then : le titre de page « Actions de référence » est visible, sans page 404', async () => {
      expect(drealPageResponse?.status()).not.toBe(404);
      await expect(actionsDeReferencePom.title).toBeVisible();
      await expect(
        page.getByRole('heading', { name: '404', exact: true })
      ).toHaveCount(0);
    });
  });
});
