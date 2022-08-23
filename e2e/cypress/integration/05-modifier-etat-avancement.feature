# language: fr

Fonctionnalité: Modifier l'état d'avancement et visualiser l'évolution des scores

  Scénario: Modifier l'état d'avancement et visualiser les scores associés à une action
    Dans ce scénario, on teste la mise à jour d'un état d'avancement, puis d'un second et enfin le retour à l'état initial du second avancement, en vérifiant à chaque fois l'impact sur le score du sous-axes et des tâches concernées.

    Etant donné que je suis connecté en tant que "yolo"
    Et que l'état d'avancement de l'action "eci_1.1%" pour la collectivité "1" est réinitialisé

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Alors aucun score n'est affiché

    Quand j'assigne la valeur "Fait" à l'état d'avancement de la tâche "eci_1.1.1.1"
    Alors les scores sont affichés avec les valeurs suivantes :
      | Action    | Score |
      | eci_1.1   | 4 %   |
      | eci_1.1.1 | 20 %  |
      | eci_1.1.2 | 0 %   |
      | eci_1.1.3 | 0 %   |
      | eci_1.1.4 | 0 %   |
      | eci_1.1.5 | 0 %   |

    Quand j'assigne la valeur "Fait" à l'état d'avancement de la tâche "eci_1.1.1.2"
    Alors les scores sont affichés avec les valeurs suivantes :
      | Action    | Score |
      | eci_1.1   | 10 %  |
      | eci_1.1.1 | 50 %  |
      | eci_1.1.2 | 0 %   |
      | eci_1.1.3 | 0 %   |
      | eci_1.1.4 | 0 %   |
      | eci_1.1.5 | 0 %   |

    Quand j'assigne la valeur "Non renseigné" à l'état d'avancement de la tâche "eci_1.1.1.2"
    Alors les scores sont affichés avec les valeurs suivantes :
      | Action    | Score |
      | eci_1.1   | 4 %   |
      | eci_1.1.1 | 20 %  |
      | eci_1.1.2 | 0 %   |
      | eci_1.1.3 | 0 %   |
      | eci_1.1.4 | 0 %   |
      | eci_1.1.5 | 0 %   |

  Scénario: Modifier l'état d'avancement et visualiser l'historique
    Dans ce scénario, on teste la mise à jour de l'historique lorsqu'on renseigne une nouvel état d'avancement.

    Etant donné que je suis connecté en tant que "yolo"
    Et que l'état d'avancement de l'action "eci_1.1%" pour la collectivité "1" est réinitialisé
    Et que l'historique de l'action "eci_1.1%" pour la collectivité "1" est réinitialisé

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je clique sur l'onglet "Historique"
    Alors aucun historique n'est affiché

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que j'assigne la valeur "Fait" à l'état d'avancement de la tâche "eci_1.1.1.1"
    Et que je clique sur l'onglet "Historique"
    Alors l'historique de l'action "eci_1.1" est affiché