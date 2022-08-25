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
    Dans ce scénario, on teste la mise à jour de l'historique lorsqu'on renseigne un nouvel état d'avancement.

    Etant donné que je suis connecté en tant que "yolo"
    Et que l'état d'avancement de l'action "eci_1.1%" pour la collectivité "1" est réinitialisé
    Et que l'historique est réinitialisé

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je clique sur l'onglet "Historique"
    Alors aucun historique n'est affiché

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que j'assigne la valeur "Fait" à l'état d'avancement de la tâche "eci_1.1.1.1"
    Et que je clique sur l'onglet "Historique"
    Alors l'historique contient 1 entrée
    Et l'entrée 1 de l'historique est affichée avec les valeurs suivantes :
      | Action : statut modifié                                                        |
      | Par : Yolo Dodo                                                                |
      | Action : 1.1 Définir une stratégie globale de la politique Economie Circulaire |
      | Tâche : 1.1.1.1 Identifier un élu référent                                     |
    Et le détail de l'entrée 1 de l'historique n'est pas affiché

    Quand je clique sur le bouton "Afficher le détail" de l'entrée 1
    Alors le détail de l'entrée 1 est affiché avec les valeurs suivantes :
      | Valeur précédente | Non renseigné |
      | Valeur courante   | Fait          |

    Quand je clique sur le bouton "Masquer le détail" de l'entrée 1
    Alors le détail de l'entrée 1 de l'historique n'est pas affiché

    Quand je clique sur l'onglet "Suivi de l'action"
    Et que je saisi "mon commentaire" dans le champ "Précisions" de la tâche "eci_1.1.1.1"
    Et que je clique sur l'onglet "Historique"
    Alors l'historique contient 2 entrées
    Et l'entrée 1 de l'historique est affichée avec les valeurs suivantes :
      | Action : texte modifié                                                         |
      | Par : Yolo Dodo                                                                |
      | Action : 1.1 Définir une stratégie globale de la politique Economie Circulaire |
      | Tâche : 1.1.1.1 Identifier un élu référent                                     |
    Et l'entrée 2 de l'historique est affichée avec les valeurs suivantes :
      | Action : statut modifié                                                        |
      | Par : Yolo Dodo                                                                |
      | Action : 1.1 Définir une stratégie globale de la politique Economie Circulaire |
      | Tâche : 1.1.1.1 Identifier un élu référent                                     |

    Quand je clique sur le bouton "Afficher le détail" de l'entrée 1
    Alors le détail de l'entrée 1 est affiché avec les valeurs suivantes :
      | Valeur précédente |                 |
      | Valeur courante   | mon commentaire |

    Quand je clique sur le bouton "Afficher le détail" de l'entrée 2
    Alors le détail de l'entrée 2 est affiché avec les valeurs suivantes :
      | Valeur précédente | Non renseigné |
      | Valeur courante   | Fait          |
