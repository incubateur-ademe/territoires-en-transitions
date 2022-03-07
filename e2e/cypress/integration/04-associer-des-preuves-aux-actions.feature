# language: fr

Fonctionnalité: Associer des preuves aux actions

  Scénario: Ajouter un lien comme preuve à une action
    Etant donné que je suis connecté en tant que "yolo"
    Et que la table des liens preuve de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que le bouton "Ajouter une preuve" à l'action "1.1.1" est absent

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors le bouton "Ajouter une preuve" à l'action "1.1.1" est visible
    Et la liste des preuves de l'action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et le "formulaire Lien" est visible
    Et le "formulaire Lien" vérifie les conditions suivantes :
      | Element | Condition |
      | titre   | vide      |
      | lien    | vide      |
      | Ajouter | désactivé |

    Quand je remplis le "formulaire Lien" avec les valeurs suivantes :
      | Champ | Valeur           |
      | titre | Exemple          |
      | lien  | https://ademe.fr |
    Alors le "formulaire Lien" vérifie les conditions suivantes :
      | Element | Condition |
      | Ajouter | activé    |

    Quand je clique sur le bouton "Ajouter" du "formulaire Lien"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

  Scénario: Ouvrir un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que la table des liens preuve de la collectivité "1" est vide
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr |             |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

    Quand je clique sur la preuve "Exemple" de l'action "1.1.1"
    Alors l'ouverture du lien "https://ademe.fr" doit avoir été demandée

  Scénario: Ajouter un commentaire à un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que la table des liens preuve de la collectivité "1" est vide
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr |             |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

    Quand je clique sur le bouton "Commentaire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Modifier le commentaire d'un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que la table des liens preuve de la collectivité "1" est vide
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire     |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr | mon commentaire |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire     |
      | Exemple | mon commentaire |

    Quand je clique sur le bouton "Commentaire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Supprimer un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que la table des liens preuve de la collectivité "1" est vide
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre              | url                                  | commentaire     |
      | 1               | eci_1.1.1 | Exemple1           | https://ademe.fr                     |                 |
      | 1               | eci_1.1.1 | Exemple2           | https://territoiresentransitions.fr/ | mon commentaire |
      | 2               | eci_1.1.1 | Autre collectivité | https://test1.fr/                    | non visible 1   |
      | 1               | eci_2.1.1 | Autre action       | https://test2.fr/                    | non visible 2   |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre    | Commentaire     |
      | Exemple1 |                 |
      | Exemple2 | mon commentaire |

    Quand je clique sur le bouton "Supprimer" de la preuve "Exemple1" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre    | Commentaire     |
      | Exemple2 | mon commentaire |

    Quand je clique sur le bouton "Supprimer" de la preuve "Exemple2" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" est vide
