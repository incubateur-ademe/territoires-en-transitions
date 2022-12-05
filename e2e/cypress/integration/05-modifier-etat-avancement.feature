# language: fr

Fonctionnalité: Modifier l'état d'avancement et visualiser l'évolution des scores

  Scénario: Modifier l'état d'avancement et visualiser les scores associés à une action
    Dans ce scénario, on teste la mise à jour d'un état d'avancement, puis d'un second et enfin le retour à l'état initial du second avancement, en vérifiant à chaque fois l'impact sur le score du sous-axes et des tâches concernées.

    Etant donné que je suis connecté en tant que "yili"

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "2"
    Alors aucun score n'est affiché
    Et l'état d'avancement des tâches est éditable

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

  Scénario: Modifier l'état d'avancement, visualiser et filtrer l'historique
    Dans ce scénario, on teste la mise à jour de l'historique lorsqu'on renseigne un nouvel état d'avancement.
    On teste aussi le comportement des filtres de l'historique

    Etant donné que je suis connecté en tant que "yili"

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "2"
    Et que je clique sur l'onglet "Historique"
    Alors aucun historique n'est affiché

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "2"
    Et que j'assigne la valeur "Fait" à l'état d'avancement de la tâche "eci_1.1.1.1"
    Et que je clique sur l'onglet "Historique"
    Alors l'historique contient 1 entrée
    Et l'entrée 1 de l'historique est affichée avec les valeurs suivantes :
      | Action : statut modifié                                                        |
      | Par : Yili Didi                                                                |
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
      | Par : Yili Didi                                                                |
      | Action : 1.1 Définir une stratégie globale de la politique Economie Circulaire |
      | Tâche : 1.1.1.1 Identifier un élu référent                                     |
    Et l'entrée 2 de l'historique est affichée avec les valeurs suivantes :
      | Action : statut modifié                                                        |
      | Par : Yili Didi                                                                |
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

    Quand je filtre l'historique avec le filtre "membre" par l'option "Yili Didi"
    Alors l'historique contient 2 entrées

    Quand je filtre l'historique avec le filtre "type" par l'option "Action : statut"
    Alors l'historique contient 1 entrée

    Quand je filtre l'historique avec le filtre "type" par l'option "Tous"
    Alors l'historique contient 2 entrées

    Quand je filtre l'historique avec comme date de fin "2022-01-01"
    Alors aucun historique n'est affiché

    Quand je désactive tous les filtres
    Alors l'historique contient 2 entrées

  Scénario: Ne pas pouvoir modifier l'état d'avancement quand un audit est en cours
    Etant donné que je suis connecté en tant que "yolo"

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Alors l'état d'avancement des tâches n'est pas éditable
    Et la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | absent    |            |
      | état audit action lecture seule | contient  | Non audité |
      | avis audit                      | vide      |            |
      | avis audit                      | désactivé |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | désactivé |            |

  Scénario: Modifier l'état d'avancement et le statut d'audit quand on est auditeur
    Etant donné que je suis connecté en tant que "youlou"

    Quand je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Alors l'état d'avancement des tâches est éditable
    Et la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | contient  | Non audité |
      | état audit action lecture seule | absent    |            |
      | avis audit                      | vide      |            |
      | avis audit                      | activé    |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | activé    |            |

    Quand je sélectionne l'option "en_cours" dans la liste déroulante "état audit action"
    Et que je saisi la valeur "mon commentaire d'audit" dans le champ "avis audit"
    Et que je clique sur la case "ajouter à l'ordre du jour"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition | Valeur                  |
      | état audit action         | contient  | Audit en cours          |
      | avis audit                | contient  | mon commentaire d'audit |
      | ajouter à l'ordre du jour | coché     |                         |
