# language: fr

Fonctionnalité: Associer des preuves aux actions

  Scénario: Ajouter un fichier comme preuve complémentaire à une sous-action
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je déplie le panneau Preuves de l'action "1.1.1"
    Et que la liste des preuves de l'action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et le "formulaire Lien" est visible

    Quand je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Alors le "formulaire Lien" est masqué
    Et le "formulaire Fichier" est visible
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "bien nommé.doc" et contenant "contenu du fichier"
    Alors la liste des fichiers transférés contient les entrées suivantes :
      | Fichier        | Etat    | Taille | Message |
      | bien nommé.doc | running | 18 o   |         |
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

    Quand tous les transferts sont terminés
    Alors la liste des fichiers transférés contient les entrées suivantes :
      | Fichier        | Etat      | Taille | Message |
      | bien nommé.doc | completed |        |         |
    Et le bouton "Ajouter" du "formulaire Fichier" est activé

    Quand je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors le "dialogue d'ajout d'une preuve" est absent
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre          | Commentaire |
      | bien nommé.doc |             |

    Quand je clique sur le bouton "Décrire" de la preuve "bien nommé.doc" de l'action "1.1.1"
    Et que je saisi "une phrase" comme commentaire de la preuve "bien nommé.doc" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre          | Commentaire |
      | bien nommé.doc | une phrase  |

    Quand je clique sur la preuve "bien nommé.doc" de l'action "1.1.1"
    Alors le fichier "bien nommé.doc" doit avoir été téléchargé

  Scénario: Visualiser une erreur lors de l'ajout d'un fichier preuve trop lourd
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je déplie le panneau Preuves de l'action "1.1.1"
    Et que la liste des preuves de l'action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et le "formulaire Lien" est visible

    Quand je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Alors le "formulaire Lien" est masqué
    Et le "formulaire Fichier" est visible
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "file.doc" et d'un poids de "21" Mo
    Alors la liste des fichiers transférés contient les entrées suivantes :
      | Fichier  | Etat   | Taille | Message                                                                           |
      | file.doc | failed | 21 Mo  | Ce fichier ne peut pas être téléversé car il dépasse la taille maximale autorisée |
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

  Scénario: Visualiser une erreur lors de l'ajout d'un fichier preuve dans un format non supporté
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je déplie le panneau Preuves de l'action "1.1.1"
    Et que la liste des preuves de l'action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et le "formulaire Lien" est visible

    Quand je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Alors le "formulaire Lien" est masqué
    Et le "formulaire Fichier" est visible
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "file.txt" et contenant "contenu du fichier"
    Alors la liste des fichiers transférés contient les entrées suivantes :
      | Fichier  | Etat   | Taille | Message                                                                 |
      | file.txt | failed | 18 o   | Ce fichier ne peut pas être téléversé car son format n’est pas supporté |
    Et le bouton "Ajouter" du "formulaire Fichier" est désactivé

  Scénario: Supprimer un fichier preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je déplie le panneau Preuves de l'action "1.1.1"
    Et que la liste des preuves de l'action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Et que je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "mon.doc" et contenant "du texte"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | mon.doc |             |

    Quand je clique sur le bouton "Supprimer" de la preuve "mon.doc" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" est vide

  Scénario: Ajouter un lien comme preuve complémentaire à une sous-action
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
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
    Et que les tables de preuves de la collectivité "1" sont vides
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
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr |             |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

    Quand je clique sur le bouton "Décrire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Modifier le commentaire d'un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des liens preuve est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire     |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr | mon commentaire |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire     |
      | Exemple | mon commentaire |

    Quand je clique sur le bouton "Décrire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves de l'action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Supprimer un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
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

  Scénario: Ajouter une preuve réglementaire à une sous-action
    On teste l'affichage et l'ajout d'une preuve réglementaire sous forme d'un lien et d'un fichier,
    mais on ne reteste pas les actions "décrire" et "supprimer" qui sont mutualisées quelque soit le type de preuve.

    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que je visite le sous-axe "1.1.1" du référentiel "cae" de la collectivité "1"
    Et que le bouton "Ajouter une preuve" à l'action "1.1.1.3" est absent

    Quand je déplie le panneau Preuves de l'action "1.1.1.3"
    Alors le bouton "Ajouter une preuve" à l'action "1.1.1.3" est visible
    Et la liste des preuves de l'action "1.1.1.3" est vide
    Et la liste des preuves attendues de l'action "1.1.1.3" contient les lignes suivantes :
      | nom                                                       | preuves |
      | Agenda 21 / Agenda 2030                                   |         |
      | Délibération d'engagement dans la Convention des Maires   |         |
      | Rapport Développement Durable                             |         |
      | Rapports diagnostic, stratégie et plan d'actions du PCAET |         |

    # on ajoute un lien
    Quand je clique sur le 1er bouton "Ajouter une preuve réglementaire" à l'action "1.1.1.3"
    Et que je remplis le "formulaire Lien" avec les valeurs suivantes :
      | Champ | Valeur           |
      | titre | Exemple          |
      | lien  | https://ademe.fr |
    Et que je clique sur le bouton "Ajouter" du "formulaire Lien"
    Alors la liste des preuves attendues de l'action "1.1.1.3" contient les lignes suivantes :
      | nom                                                       | preuves |
      | Agenda 21 / Agenda 2030                                   | Exemple |
      | Délibération d'engagement dans la Convention des Maires   |         |
      | Rapport Développement Durable                             |         |
      | Rapports diagnostic, stratégie et plan d'actions du PCAET |         |

    # et un fichier
    Quand je clique sur le 1er bouton "Ajouter une preuve réglementaire" à l'action "1.1.1.3"
    Et que je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "fichier.xls" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des preuves attendues de l'action "1.1.1.3" contient les lignes suivantes :
      | nom                                                       | preuves             |
      | Agenda 21 / Agenda 2030                                   | Exemple,fichier.xls |
      | Délibération d'engagement dans la Convention des Maires   |                     |
      | Rapport Développement Durable                             |                     |
      | Rapports diagnostic, stratégie et plan d'actions du PCAET |                     |
