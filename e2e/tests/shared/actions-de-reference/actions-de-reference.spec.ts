import { test } from 'tests/main.fixture';

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
        'Then : les articles « Isoler les combles perdus » et « Rénover les écoles » sont visibles',
        toBeAutomated
      );
      await test.step(
        "Then : l'article « Aménager des aires de covoiturage » est absent",
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
      "Then : l'article « Développer les réseaux de chaleur » est visible",
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
      "Then : la liste nommée « Tri » affiche « Titre » et les articles se suivent dans l'ordre « Aménager », « Isoler », « Végétaliser »",
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
        "Then : les articles se suivent dans l'ordre renvoyé par shared.actionsDeReference.list triée par levier",
        toBeAutomated
      );
      await test.step(
        'When : il choisit « Catégorie » dans la liste nommée « Tri »',
        toBeAutomated
      );
      await test.step(
        "Then : les articles se suivent dans l'ordre renvoyé par shared.actionsDeReference.list triée par catégorie",
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
  test.fixme(
    "sans aucune action en base ni filtre actif, le même état vide s'affiche avec son bouton",
    async () => {
      await test.step(
        "Given : aucune action de référence n'existe",
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur ouvre la vue des actions de référence sans paramètre",
        toBeAutomated
      );
      await test.step(
        'Then : le texte « Aucune action de référence ne correspond à votre recherche » et le bouton « Effacer les filtres » sont visibles',
        toBeAutomated
      );
    }
  );
});

test.describe('card-affiche-action-entiere', () => {
  test.fixme(
    'une card montre le titre, la description entière, le levier et la catégorie',
    async () => {
      await test.step(
        'Given : une action « Planter des haies bocagères » existe, description de quatre paragraphes, levier « Gestion des haies », catégorie « Financement & fiscalité »',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur ouvre la vue des actions de référence",
        toBeAutomated
      );
      await test.step(
        "Then : l'article « Planter des haies bocagères » contient le titre, les quatre paragraphes de la description, « Gestion des haies » et « Financement & fiscalité »",
        toBeAutomated
      );
    }
  );
});

test.describe('liste-en-chargement', () => {
  test.fixme(
    "un indicateur de chargement remplace les cards tant que la liste n'est pas arrivée",
    async () => {
      await test.step(
        'Given : la réponse de shared.actionsDeReference.list est retenue par page.route',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur ouvre la vue des actions de référence",
        toBeAutomated
      );
      await test.step(
        "Then : un élément de rôle status est visible et aucun article n'est affiché",
        toBeAutomated
      );
      await test.step('When : la réponse est relâchée', toBeAutomated);
      await test.step(
        "Then : l'élément de rôle status disparaît et les articles sont visibles",
        toBeAutomated
      );
    }
  );
});

test.describe('liste-en-erreur', () => {
  test.fixme(
    "une erreur de l'API montre un état d'erreur, et « Réessayer » recharge la liste",
    async () => {
      await test.step(
        'Given : shared.actionsDeReference.list répond 500 par page.route',
        toBeAutomated
      );
      await test.step(
        "When : l'utilisateur ouvre la vue des actions de référence",
        toBeAutomated
      );
      await test.step(
        "Then : la carte d'erreur et le bouton « Réessayer » sont visibles, aucun article n'est affiché",
        toBeAutomated
      );
      await test.step(
        "When : la route n'est plus interceptée et il clique le bouton « Réessayer »",
        toBeAutomated
      );
      await test.step('Then : les articles sont visibles', toBeAutomated);
    }
  );
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
        "Then : l'URL porte les paramètres texte, leviers, categories et sortBy",
        toBeAutomated
      );
      await test.step('When : il recharge la page', toBeAutomated);
      await test.step(
        'Then : le champ de recherche affiche « combles », le levier et la catégorie restent choisis, la liste « Tri » affiche « Levier » et les mêmes articles sont visibles',
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
        'Then : les champs et les articles sont identiques à ceux de la première page',
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
  test.fixme(
    "un utilisateur connecté qui n'est pas super admin ne voit aucun bouton de modification",
    async () => {
      await test.step(
        'Given : un utilisateur connecté sans rôle super admin et deux actions de référence',
        toBeAutomated
      );
      await test.step(
        'When : il ouvre la vue des actions de référence',
        toBeAutomated
      );
      await test.step(
        "Then : aucun bouton dont le nom commence par « Modifier l'action » n'est présent",
        toBeAutomated
      );
    }
  );

  test.fixme(
    'un super admin voit un bouton de modification sur chaque card',
    async () => {
      await test.step(
        'Given : un super admin et deux actions de référence',
        toBeAutomated
      );
      await test.step(
        'When : il ouvre la vue des actions de référence',
        toBeAutomated
      );
      await test.step(
        "Then : chaque article porte un bouton « Modifier l'action « <titre> » »",
        toBeAutomated
      );
    }
  );
});

test.describe('modifier-action', () => {
  test.fixme(
    "un super admin modifie les quatre champs d'une action, la liste se met à jour et un toast confirme",
    async () => {
      await test.step(
        'Given : un super admin et une action « Aménager des aires de covoiturage »',
        toBeAutomated
      );
      await test.step(
        "When : il clique le bouton « Modifier l'action « Aménager des aires de covoiturage » »",
        toBeAutomated
      );
      await test.step(
        "Then : le volet « Modifier l'action de référence » s'ouvre, ses champs « Titre », « Description », « Levier » et « Catégorie » sont préremplis",
        toBeAutomated
      );
      await test.step(
        'When : il change les quatre champs et clique le bouton « Enregistrer »',
        toBeAutomated
      );
      await test.step(
        'Then : le toast « Action de référence modifiée » est visible et le volet est fermé',
        toBeAutomated
      );
      await test.step(
        "Then : l'article affiche le nouveau titre, la nouvelle description, le nouveau levier et la nouvelle catégorie",
        toBeAutomated
      );
    }
  );
});

test.describe('modifier-action-conflit', () => {
  test.fixme(
    "enregistrer un triplet levier, catégorie et titre déjà pris affiche le message d'action identique",
    async () => {
      await test.step(
        'Given : un super admin et deux actions de même levier et même catégorie, « Action A » et « Action B »',
        toBeAutomated
      );
      await test.step(
        'When : il ouvre le volet de « Action B », saisit « Action A » dans le champ « Titre » et clique le bouton « Enregistrer »',
        toBeAutomated
      );
      await test.step(
        "Then : le toast d'erreur « Une action de référence identique existe déjà. » est visible",
        toBeAutomated
      );
      await test.step(
        "Then : le volet reste ouvert avec la saisie, et l'article « Action B » est inchangé dans la liste",
        toBeAutomated
      );
    }
  );
});

test.describe('modifier-action-validation', () => {
  test.fixme(
    "un titre vide, un titre de 301 caractères ou une description vide bloquent l'enregistrement avant l'envoi",
    async () => {
      await test.step(
        "Given : un super admin a ouvert le volet d'une action, les appels à shared.actionsDeReference.update sont comptés par page.route",
        toBeAutomated
      );
      await test.step('When : il vide le champ « Titre »', toBeAutomated);
      await test.step(
        "Then : un message d'erreur est visible sous « Titre » et le bouton « Enregistrer » est désactivé",
        toBeAutomated
      );
      await test.step(
        'When : il saisit 301 caractères dans le champ « Titre »',
        toBeAutomated
      );
      await test.step(
        "Then : un message d'erreur est visible sous « Titre » et le bouton « Enregistrer » est désactivé",
        toBeAutomated
      );
      await test.step(
        'When : il saisit 300 caractères dans « Titre » et vide le champ « Description »',
        toBeAutomated
      );
      await test.step(
        "Then : un message d'erreur est visible sous « Description » et le bouton « Enregistrer » est désactivé",
        toBeAutomated
      );
      await test.step(
        "Then : aucun appel à shared.actionsDeReference.update n'a été émis",
        toBeAutomated
      );
    }
  );
});

test.describe('modifier-action-en-erreur', () => {
  test.fixme(
    "une erreur de l'API hors conflit affiche un toast d'erreur",
    async () => {
      await test.step(
        "Given : un super admin a ouvert le volet d'une action, shared.actionsDeReference.update répond 500 par page.route",
        toBeAutomated
      );
      await test.step(
        'When : il change le champ « Titre » et clique le bouton « Enregistrer »',
        toBeAutomated
      );
      await test.step(
        "Then : le toast d'erreur « La modification de l'action de référence a échoué » est visible",
        toBeAutomated
      );
      await test.step(
        'Then : le volet reste ouvert avec la saisie',
        toBeAutomated
      );
    }
  );
});

test.describe('fermer-volet-modifications-non-enregistrees', () => {
  test.fixme(
    'fermer le volet avec une saisie non enregistrée demande confirmation, et poursuivre garde la saisie',
    async () => {
      await test.step(
        "Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »",
        toBeAutomated
      );
      await test.step(
        'When : il clique le bouton « Fermer » du volet',
        toBeAutomated
      );
      await test.step(
        'Then : la boîte de dialogue « Modifications non enregistrées » est visible',
        toBeAutomated
      );
      await test.step(
        'When : il clique le bouton « Poursuivre la modification »',
        toBeAutomated
      );
      await test.step(
        'Then : la boîte de dialogue est fermée, le volet est ouvert et le champ « Titre » porte la saisie',
        toBeAutomated
      );
    }
  );

  test.fixme('confirmer la fermeture abandonne la saisie', async () => {
    await test.step(
      "Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »",
      toBeAutomated
    );
    await test.step(
      'When : il clique le bouton « Fermer » du volet puis le bouton « Fermer sans enregistrer »',
      toBeAutomated
    );
    await test.step(
      "Then : le volet est fermé et l'article affiche son titre d'origine",
      toBeAutomated
    );
  });

  test.fixme(
    'fermer le volet sans avoir rien changé ne demande aucune confirmation',
    async () => {
      await test.step(
        "Given : un super admin a ouvert le volet d'une action sans rien changer",
        toBeAutomated
      );
      await test.step(
        'When : il clique le bouton « Fermer » du volet',
        toBeAutomated
      );
      await test.step(
        "Then : le volet est fermé et aucune boîte de dialogue ne s'est ouverte",
        toBeAutomated
      );
    }
  );

  test.fixme(
    'quitter la page avec une saisie non enregistrée ferme le volet sans confirmation',
    async () => {
      await test.step(
        "Given : un super admin a ouvert le volet d'une action et changé le champ « Titre »",
        toBeAutomated
      );
      await test.step(
        'When : il clique un autre lien de la navigation',
        toBeAutomated
      );
      await test.step(
        "Then : la page change, aucune boîte de dialogue ne s'ouvre",
        toBeAutomated
      );
    }
  );
});

test.describe('action-modifiee-sort-des-filtres', () => {
  test.fixme(
    'une action dont le levier change disparaît de la liste filtrée sur son ancien levier',
    async () => {
      await test.step(
        "Given : un super admin a choisi « Covoiturage » dans la liste « Leviers », l'article « Aménager des aires de covoiturage » est visible",
        toBeAutomated
      );
      await test.step(
        'When : il ouvre le volet de cette action, choisit « Gestion des haies » dans le champ « Levier » et clique le bouton « Enregistrer »',
        toBeAutomated
      );
      await test.step(
        "Then : l'article « Aménager des aires de covoiturage » disparaît de la liste sans rechargement de la page",
        toBeAutomated
      );
      await test.step(
        'Then : « Covoiturage » reste le levier choisi dans la liste « Leviers »',
        toBeAutomated
      );
    }
  );
});

test.describe('entree-nav-masquee-en-prod', () => {
  test.fixme(
    "hors prod, l'entrée « Actions de référence » à la racine de la navigation mène à la vue",
    async () => {
      await test.step(
        "Given : un utilisateur connecté, membre d'une collectivité standard, est sur le tableau de bord de sa collectivité",
        toBeAutomated
      );
      await test.step(
        'When : il clique le lien « Actions de référence » de la navigation principale',
        toBeAutomated
      );
      await test.step(
        "Then : l'URL est /collectivite/:id/actions-reference et le titre de page « Actions de référence » est visible",
        toBeAutomated
      );
    }
  );
});

test.describe('page-accessible-par-url-en-prod', () => {
  test.fixme(
    "la page s'affiche par son URL directe pour un utilisateur connecté",
    async () => {
      await test.step(
        'Given : un utilisateur connecté, non membre de la collectivité visée',
        toBeAutomated
      );
      await test.step(
        'When : il ouvre directement /collectivite/:id/actions-reference',
        toBeAutomated
      );
      await test.step(
        'Then : le titre de page « Actions de référence » et les articles sont visibles',
        toBeAutomated
      );
    }
  );

  test.fixme(
    "la page s'affiche aussi dans le contexte d'un service déconcentré",
    async () => {
      await test.step(
        "Given : un utilisateur connecté, membre d'une DREAL",
        toBeAutomated
      );
      await test.step(
        'When : il ouvre directement /collectivite/:idDreal/actions-reference',
        toBeAutomated
      );
      await test.step(
        'Then : le titre de page « Actions de référence » est visible, sans page 404',
        toBeAutomated
      );
    }
  );
});
