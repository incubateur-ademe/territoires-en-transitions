# language: fr

Fonctionnalité: Collectivités engagées

  Scénario: Visualiser les collectivités sans être connecté
    Quand je visite la vue "Toutes les collectivités"
    Alors le toggle "ToggleVuePlan" est désactivé
    Alors la page contient au moins 3 collectivités
    Alors la carte collectivite ne devrait pas être cliquable

  Scénario: Filtrer les collectivités
    Etant donné que je suis connecté en tant que "yolo"

    Quand je visite la vue "Toutes les collectivités"
    Alors la page contient au moins 3 collectivités

    Quand je recherche "Arbent" dans les collectivités
    Alors la page contient 1 collectivité

    Quand je clique sur la carte de la collectivité
    Alors la page "Accueil" est visible

  Scénario: Filtrer les plans d'action
    Etant donné que je suis connecté en tant que "yolo"

    Quand je visite la vue "Toutes les collectivités"
    Alors la page contient au moins 3 collectivités

    Quand je clique sur le toggle "ToggleVuePlan"
    Alors la page contient au moins 2 plans d'action

    Quand je clique sur la carte du plan
    Alors la page "Plans action" est visible
