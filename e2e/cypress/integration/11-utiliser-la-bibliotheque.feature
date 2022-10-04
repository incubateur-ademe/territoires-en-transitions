# language: fr

Fonctionnalité: Utiliser la bibliothèque de documents de la collectivité

  Scénario: Ajouter un rapport de visite annuelle depuis la bibliothèque
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Alors il n'y a pas de rapports de visite annuelle

    Quand je clique sur le bouton "Ajouter un rapport de visite"
    Alors le bouton "Ajouter le rapport" est désactivé

    Quand je saisi comme date de visite "2022-10-03"
    Alors le bouton "Ajouter le rapport" est activé

    Quand je clique sur le bouton "Ajouter le rapport"
    Alors le "formulaire Lien" est visible
    Et le bouton "Ajouter le rapport" est absent

    Quand je remplis le "formulaire Lien" avec les valeurs suivantes :
      | Champ | Valeur           |
      | titre | Exemple          |
      | lien  | https://ademe.fr |
    Et que je clique sur le bouton "Ajouter" du "formulaire Lien"
    Alors la liste des rapports de visite contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

  Scénario: Ajouter un document de labellisation et le visualiser dans la bibliothèque
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Alors il n'y a pas de documents de labellisation

    Quand je suis sur la page "Labellisation CAE" de la collectivité "1"
    Alors la liste des documents de la page Labellisation est vide

    Quand je clique sur le bouton "Ajouter un document de labellisation"
    Alors le "formulaire Fichier" est visible

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "doc labellisation.pdf" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Alors la liste des documents de labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |

  Scénario: Associer une preuve complémentaire à une sous-action depuis la bibliothèque
    Etant donné que je suis connecté en tant que "yolo"
    Et que les tables de preuves de la collectivité "1" sont vides
    Et que la bibliothèque de la collectivité "1" est vide

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Et que je déplie la sous-action "1.1.1.1" du référentiel "cae"
    Alors la liste des preuves complémentaires associées à la sous-action "cae_1.1.1.1" est vide

    Quand je clique sur le bouton "Ajouter une preuve" de la sous-action "cae_1.1.1.1"
    Et que je remplis le "formulaire Lien" avec les valeurs suivantes :
      | Champ | Valeur           |
      | titre | Exemple          |
      | lien  | https://ademe.fr |
    Et que je clique sur le bouton "Ajouter" du "formulaire Lien"
    Alors la liste des preuves complémentaires associées à la sous-action "cae_1.1.1.1" contient les lignes suivantes :
      | Titre   | Commentaire |
      | Exemple |             |

