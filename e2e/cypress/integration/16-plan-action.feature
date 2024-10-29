# language: fr

Fonctionnalité: Gérer les fiches et les plans d'action

  Scénario: Ajouter, éditer et supprimer une fiche action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"
    # créer une fiche depuis la barre de navigation latérale
    Quand je clique sur le bouton "Créer une fiche action"
    Alors le "Fiche action" est visible
    # modifier le titre en "Fiche test"
    Quand je clique sur le bouton invisible "éditer le titre"
    Et que je saisi la valeur "Fiche test" dans le champ "titre"
    Et que je clique en dehors de la boîte de dialogue
    Alors le "titre de la fiche" contient "Fiche test"
    # créer un tag personne pilote "Michel Sapasse"
    Quand je clique sur le bouton "Ajouter les acteurs"
    Et que je crée un tag "Michel Sapasse" avec le sélecteur de tag "personnes-pilotes"
    Et que je clique sur le bouton "Valider"
    Alors "Personne pilote" contient "Michel Sapasse"
    # ajouter un statut "En cours"
    Quand je clique sur le bouton "Ajouter le planning"
    Et que je sélectionne "En cours" dans la liste déroulante "statuts"
    Et que je clique sur le bouton "Valider"
    Alors "Planning non renseigné" contient "En cours"
    # naviguer vers fiche non classées' et vérifier la présence de la fiche créée
    Quand je suis sur la page "Fiches non classees" de la collectivité "1"
    Alors la carte de la fiche créée est présente et affiche le titre "Fiche test", le pilote "Michel Sapasse" et le statut "En cours"
    # supprimer la fiche créée
    Quand je navigue vers la fiche "Fiche test"
    Et que je supprime la fiche
    Et que je suis sur la page "Fiches non classees" de la collectivité "1"
    Alors la fiche "Fiche test" n'est plus présente

  Scénario: Ranger une fiche action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"
    # ajouter un nouveau plan d'action
    Quand je clique sur le bouton "Ajouter un plan d'action"
    Et que je crée le plan "Plan test" avec le type "Plan CTE/CRTE"
    # ajouter un nouveau titre et lui donner ce contenu "Axe 1: les tests passent"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 1: les tests passent"
    # ajouter une fiche au plan d'action
    Quand j'ajoute une fiche au plan d'action
    Et que je nomme la carte "Fiche test"
    # naviguer vers cette fiche
    Et que je navigue vers la fiche "Fiche test"
    # ouvrir la modale "Ranger la fiche"
    Et que j'ouvre la modale ranger la fiche
    Alors le "Modale ranger fiche action" est visible
    # enlever la fiche du plan d'action
    # le plan doit apparaitre dans "Sélectionner un nouvel emplacement"
    Quand j'enlève la fiche du plan
    Alors le plan "Plan test" est visible dans le tableau nouvel emplacement
    # fermer la modale
    # le fil d'ariane de la fiche doit contenir "Fiches non classées"
    Quand je clique en dehors de la boîte de dialogue
    Alors le fil d'ariane de la fiche contient "Fiches non classées"
    # ranger la fiche dans Axe 1: les tests passent du plan "Plan test"
    Quand Et que j'ouvre la modale ranger la fiche
    Et que je clique sur l'axe "Plan test" du tableau nouvel emplacement
    Et que je clique sur l'axe "Axe 1: les tests passent" du tableau nouvel emplacement
    Et que je valide cet emplacement
    Alors l'axe "Axe 1: les tests passent" est visible dans les emplacements sélectionnés pour cette fiche
    # fermer la modale
    # le fil d'ariane de la fiche doit contenir "Axe 1"
    Quand je clique en dehors de la boîte de dialogue
    Alors le fil d'ariane de la fiche contient "Axe 1: les tests passent"

  Scénario: Rendre confidentielles des fiches
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"
    # créer un plan d'action depuis la barre de navigation latérale
    Quand je clique sur le bouton "Ajouter un plan d'action"
    Et que je crée le plan "Plan test" avec le type "Plan CTE/CRTE"
    # ajouter une fiche au plan d'action
    Quand j'ajoute une fiche au plan d'action
    Et que je nomme la carte "Fiche test 1"
    # ajouter une fiche au plan d'action
    Quand j'ajoute une fiche au plan d'action
    Et que je nomme la carte "Fiche test 2"
    # naviguer vers cette fiche
    Et que je navigue vers la fiche "Fiche test 2"
    # changer la confidentialité
    Et que je clique sur le bouton "Modifier la restriction d'accès"
    Et que je toggle la confidentialité de la fiche
    # revenir sur le plan d'action
    Et que je navigue vers "Plan test" du fil d'ariane de la fiche
    # la fiche doit etre confidentielle
    Alors la carte "Fiche test 2" est privée
    # rendre toutes les fiches publiques
    Quand je rends publiques toutes les fiches d'un plan
    # les fiches doivent etre publique
    Alors toutes les cartes sont publiques
    # rendre toutes les fiches privées
    Quand je rends privées toutes les fiches d'un plan
    # se connecter comme yala dada
    Quand je me reconnecte en tant que visiteur
    # aller sur le plan d'action
    Et que je suis sur la page "Plans action" de la collectivité "1"
    Et que je navigue vers le plan "Plan test"
    # les fiches doivent etre privées
    Alors la fiche "Fiche test 1" n'est plus présente
    Et la fiche "Fiche test 2" n'est plus présente

  Scénario: Ajouter, éditer et supprimer un plan d'action
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"

    # créer un plan d'action depuis la barre de navigation latérale
    Quand je clique sur le bouton "Ajouter un plan d'action"
    Et que je crée le plan "Plan testy" avec le type "Plan CTE/CRTE"
    Alors le "Plan action" est visible
    Alors le texte "Plan CTE/CRTE" est visible
    Alors le nom du plan d'action est changé en "Plan testy" dans la navigation

    # renommer un plan
    Quand je renomme le plan en "Plan test"
    Alors le nom du plan d'action est changé en "Plan test" dans la navigation

    # ajouter une fiche au plan d'action
    Quand j'ajoute une fiche au plan d'action
    Et que je navigue vers le plan "Plan test"
    Alors le "Filtrer les fiches" est visible

    # ajouter un deuxième axe "Axe 0"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 0"
    # supprimer "Axe 0"
    Et que je veux supprimer le dernier axe créé
    Alors le texte "Il n'y a aucune fiche dans ce niveau et son arborescence" est visible

    #confirmer et vérifier
    Quand je supprime l'axe depuis la modale
    Alors l'axe "Axe 0" n'est plus visible

    # vérifier le texte de suppression du plan sans fiche
    Quand je veux supprimer le plan
    Alors le texte "Souhaitez-vous supprimer ce plan, son arborescence et les fiches qui y sont liées" est visible

    Quand je clique en dehors de la boîte de dialogue

    # supprimer la fiche crée précédemment
    Quand je supprime une fiche "Sans titre" dans l'arborescence
    Alors la fiche "Sans titre" n'est plus présente

    # supprimer le plan d'action
    Quand je veux supprimer le plan
    Alors le texte "Il n'y a aucune fiche dans ce plan et son arborescence" est visible

    Quand je supprime l'axe depuis la modale
    Alors le plan n'est plus présent dans la navigation

  Scénario: Visiter une page axe et filtrer les fiches
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Plans action" de la collectivité "1"

    # créer un plan d'action depuis la barre de navigation latérale
    Quand je clique sur le bouton "Ajouter un plan d'action"
    Et que je crée le plan "Plan test" avec le type "Plan CTE/CRTE"

    # ajouter un nouveau titre et lui donner ce contenu "Axe 1: les tests passent"
    Quand j'ajoute un nouveau titre
    Et que je le nomme "Axe 1: les tests passent"

    # naviguer sur la page axe
    Quand j'ouvre "Plan test" dans la navigation latérale
    Et que je navigue vers "Axe 1: les tests passent"
    Alors le "Page axe" est visible

    # ajouter une fiche
    Quand j'ajoute une fiche à la page axe
    Et que je nomme la carte "Fiche test"
    # naviguer vers cette fiche
    Et que je navigue vers la fiche "Fiche test"

    # créer un tag personne pilote "Michel Sapasse"
    Quand je clique sur le bouton "Ajouter les acteurs"
    Et que je crée un tag "Michel Sapasse" avec le sélecteur de tag "personnes-pilotes"
    Et que je clique sur le bouton "Valider"
    Alors "Personne pilote" contient "Michel Sapasse"

    # ajouter un statut "En cours"
    Quand je clique sur le bouton "Ajouter le planning"
    Et que je sélectionne "En cours" dans la liste déroulante "statuts"
    Et que je clique sur le bouton "Valider"
    Alors "Planning non renseigné" contient "En cours"

    Quand je navigue vers "Axe 1: les tests passent" du fil d'ariane de la fiche
    Et que j'ouvre les filtres
    Et que je filtre les fiches par "Yolo Dodo" du filtre "personne-pilote"
    Alors aucune fiche n'est présente

    Quand je filtre les fiches par "Michel Sapasse" du filtre "personne-pilote"
    Alors la fiche contenant "Michel Sapasse" est visible

  Scénario: Visiter la page des graphiques de synthèse et filter les fiches
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Synthèse plans action" de la collectivité "1"

    Quand je clique sur le bouton "Répartition par pilote"
    Alors le "Page graph de synthèse" est visible

    Quand je filtre par "Plan Vélo 2020-2024"
    Alors "6" fiches action s'affichent

    Quand je filtre par "Sans pilote"
    Alors "2" fiches action s'affichent

    Quand je filtre par "Harry Cot"
    Alors "2" fiches action s'affichent

    Quand je filtre les fiches par "Sans élu·e référent·e" du filtre "personne-referentes"
    Alors "1" fiches action s'affichent

    Quand je clique sur le bouton "Désactiver tous les filtres"
    Alors un message demandant à l'utilisateur de sélectionner un filtre s'affiche
