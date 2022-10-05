# language: fr

Fonctionnalité: Associer des preuves aux actions

  Scénario: Ajouter un fichier comme preuve complémentaire à une sous-action
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que je déplie le panneau Preuves de l'action "1.1.1"
    Et que la liste des preuves complémentaires de la sous-action "1.1.1" est vide

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
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre          | Commentaire |
      | bien nommé.doc |             |

    Quand je clique sur le bouton "Décrire" de la preuve "bien nommé.doc" de l'action "1.1.1"
    Et que je saisi "une phrase" comme commentaire de la preuve "bien nommé.doc" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
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
    Et que la liste des preuves complémentaires de la sous-action "1.1.1" est vide

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
    Et que la liste des preuves complémentaires de la sous-action "1.1.1" est vide

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
    Et que la liste des preuves complémentaires de la sous-action "1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" à l'action "1.1.1"
    Et que je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "mon.doc" et contenant "du texte"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | mon.doc |             |

    Quand je clique sur le bouton "Supprimer" de la preuve "mon.doc" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" est vide

  Scénario: Ajouter un lien comme preuve complémentaire à une sous-action
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"
    Et que le bouton "Ajouter une preuve" à l'action "1.1.1" est absent

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors le bouton "Ajouter une preuve" à l'action "1.1.1" est visible
    Et la liste des preuves complémentaires de la sous-action "1.1.1" est vide

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
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

  Scénario: Ouvrir un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des preuves complémentaires est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr |             |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

    Quand je clique sur la preuve "Exemple" de l'action "1.1.1"
    Alors l'ouverture du lien "https://ademe.fr" doit avoir été demandée

  Scénario: Ajouter un commentaire à un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des preuves complémentaires est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr |             |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

    Quand je clique sur le bouton "Décrire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Modifier le commentaire d'un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des preuves complémentaires est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre   | url              | commentaire     |
      | 1               | eci_1.1.1 | Exemple | https://ademe.fr | mon commentaire |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire     |
      | Exemple | mon commentaire |

    Quand je clique sur le bouton "Décrire" de la preuve "Exemple" de l'action "1.1.1"
    Et que je saisi "deux mots" comme commentaire de la preuve "Exemple" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple | deux mots   |

  Scénario: Supprimer un lien preuve
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des preuves complémentaires est initialisée avec les données suivantes :
      | collectivite_id | action_id | titre              | url                                  | commentaire     |
      | 1               | eci_1.1.1 | Exemple1           | https://ademe.fr                     |                 |
      | 1               | eci_1.1.1 | Exemple2           | https://territoiresentransitions.fr/ | mon commentaire |
      | 2               | eci_1.1.1 | Autre collectivité | https://test1.fr/                    | non visible 1   |
      | 1               | eci_2.1.1 | Autre action       | https://test2.fr/                    | non visible 2   |
    Et que je visite le sous-axe "1.1" du référentiel "eci" de la collectivité "1"

    Quand je déplie le panneau Preuves de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre    | Commentaire     |
      | Exemple1 |                 |
      | Exemple2 | mon commentaire |

    Quand je clique sur le bouton "Supprimer" de la preuve "Exemple1" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" contient les lignes suivantes :
      | Titre    | Commentaire     |
      | Exemple2 | mon commentaire |

    Quand je clique sur le bouton "Supprimer" de la preuve "Exemple2" de l'action "1.1.1"
    Alors la liste des preuves complémentaires de la sous-action "1.1.1" est vide

  Scénario: Ajouter une preuve réglementaire à une sous-action
    On teste l'affichage et l'ajout d'une preuve réglementaire sous forme d'un lien et d'un fichier,
    mais on ne reteste pas les actions "décrire" et "supprimer" qui sont mutualisées quelque soit le type de preuve.

    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide
    Et que je visite le sous-axe "1.3.2" du référentiel "cae" de la collectivité "1"
    Et que le bouton "Ajouter une preuve" à l'action "1.3.2.3" est absent

    Quand je déplie le panneau Preuves de l'action "1.3.2.3"
    Alors le bouton "Ajouter une preuve" à l'action "1.3.2.3" est visible
    Et la liste des preuves complémentaires de la sous-action "1.3.2.3" est vide
    Et la liste des preuves attendues de la sous-action "1.3.2.3" contient les lignes suivantes :
      | nom                                                                                                                             | preuves |
      | Cahier des charges ou règlement de consultation rédigé par la collectivité pour des projets d’urbanisme ou de bâtiments publics |         |
      | Convention de partenariat avec des organismes certificateurs du bâtiment                                                        |         |

    # on ajoute un lien
    Quand je clique sur le 1er bouton "Ajouter une preuve réglementaire" à l'action "1.3.2.3"
    Et que je remplis le "formulaire Lien" avec les valeurs suivantes :
      | Champ | Valeur           |
      | titre | Exemple          |
      | lien  | https://ademe.fr |
    Et que je clique sur le bouton "Ajouter" du "formulaire Lien"
    Alors la liste des preuves attendues de la sous-action "1.3.2.3" contient les lignes suivantes :
      | nom                                                                                                                             | preuves |
      | Cahier des charges ou règlement de consultation rédigé par la collectivité pour des projets d’urbanisme ou de bâtiments publics | Exemple |
      | Convention de partenariat avec des organismes certificateurs du bâtiment                                                        |         |

    # et un fichier
    Quand je clique sur le 1er bouton "Ajouter une preuve réglementaire" à l'action "1.3.2.3"
    Et que je clique sur l'onglet "Fichier" du "dialogue d'ajout d'une preuve"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "fichier.xls" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des preuves attendues de la sous-action "1.3.2.3" contient les lignes suivantes :
      | nom                                                                                                                             | preuves             |
      | Cahier des charges ou règlement de consultation rédigé par la collectivité pour des projets d’urbanisme ou de bâtiments publics | Exemple,fichier.xls |
      | Convention de partenariat avec des organismes certificateurs du bâtiment                                                        |                     |

  Scénario: Visualiser toutes les preuves associées à une action et ses sous-actions (1/2)
    On sépare ce test en 2 scénarios car, pour une raison non élucidée, les étapes
    d'injection des données ("la table des preuves ... est initialisée avec") échouent
    en timeout (promesse non résolue, alors que l'insert dans la base est pourtant effectif)
    lorsqu'on a déjà navigué sur une page ("Quand je visite l'onglet...")

    # scénario 1 : on vérifie l'affichage de l'onglet lorsqu'il n'y a pas de donnée
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide

    Quand je visite l'onglet "preuves" de l'action "2.3.1" du référentiel "cae" de la collectivité "1"
    Alors la liste des preuves attendues de l'action contient les lignes suivantes :
      | nom                                             | preuves |
      | Cahier des prescriptions éclairage public       |         |
      | Politique éclairage, Plan d’aménagement lumière |         |
      | Calcul ratio éclairage public                   |         |
    Et la liste des preuves complémentaires de l'action est vide

  Scénario: Visualiser toutes les preuves associées à une action et ses sous-actions (2/2)
    # scénario 2 : on vérifie l'affichage de l'onglet lorsqu'il y a des données
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la table des preuves réglementaires est initialisée avec les données suivantes :
      | collectivite_id | preuve_id | titre     | url            | commentaire |
      | 1               | ratio_EP  | Exemple 1 | https://ex1.fr | ex1         |
    Et que la table des preuves complémentaires est initialisée avec les données suivantes :
      | collectivite_id | action_id   | titre     | url            | commentaire |
      | 1               | cae_2.3.1.4 | Exemple 2 | https://ex2.fr | ex2         |

    Quand je visite l'onglet "preuves" de l'action "2.3.1" du référentiel "cae" de la collectivité "1"
    Alors la liste des preuves attendues de l'action contient les lignes suivantes :
      | nom                                             | preuves   |
      | Cahier des prescriptions éclairage public       |           |
      | Politique éclairage, Plan d’aménagement lumière |           |
      | Calcul ratio éclairage public                   | Exemple 1 |
    Et la liste des preuves complémentaires de l'action contient les lignes suivantes :
      | Titre     | Commentaire |
      | Exemple 2 | ex2         |
