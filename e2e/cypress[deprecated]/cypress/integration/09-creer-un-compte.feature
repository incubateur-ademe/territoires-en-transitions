# language: fr

Fonctionnalité: Créer un compte

  Scénario: Créer un compte et se connecter
    Etant donné que la mailbox de "nono" est vidée
    Alors la mailbox de "nono" contient 0 message

    Quand j'ouvre le site
    Alors la page vérifie les conditions suivantes :
      | Elément                 | Condition |
      | header                  | visible   |
      | home                    | visible   |
      | formulaire de connexion | absent    |
      | footer                  | présent   |

    Quand je clique sur le bouton "Créer un compte" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de création de compte | visible   |
      | footer                           | absent    |

    # étape 1 : saisie email/mdp
    Quand je clique sur le bouton "Compte avec mot de passe"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | nono@dodo.com |
      | mdp   | Noo0000oo00!! |
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément             | Condition |
      | header              | visible   |
      | home                | absent    |
      | message lien envoyé | visible   |
    Et la mailbox de "nono" contient 1 message
    Et le dernier message dans la mailbox de "nono" contient le texte "Valider mon inscription"

    # étape 2 : saisie code OTP
    Quand je saisi le code OTP du dernier message de la mailbox de "nono"
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de création de compte | visible   |

    # étape 3 : saisie infos sur l'utilisateur + validation CGU
    Quand je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ     | Valeur     |
      | nom       | Dodo       |
      | prenom    | Nono       |
      | telephone | 0123456789 |
    Et que je clique sur le bouton "cgu" du "formulaire de création de compte"
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de connexion          | absent    |
      | formulaire de création de compte | absent    |
      | toutes les collectivités         | absent    |
      | finaliser mon inscription        | visible   |
      | footer                           | présent   |

  Scénario: Ne pas pouvoir créer un compte avec un email qui existe déjà
    Etant donné que j'ouvre le site

    Quand j'ouvre le site
    Et que je clique sur le bouton "Créer un compte" du "header"
    Alors le "formulaire de création de compte" est visible

    Quand je clique sur le bouton "Compte avec mot de passe"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ | Valeur                |
      | email | <email>               |
      | mdp   | monmotdepassesécurisé |

    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors le "message d'erreur" du "formulaire de création de compte" contient "Utilisateur déjà enregistré"

    Exemples:
      | email         |
      | yolo@dodo.com |
      # essai de création du compte avec le même email mais une casse différente
      | YoLo@dOdO.cOm |

  Scénario: Créer un compte sans mot de passe et se connecter
    Etant donné que la mailbox de "nono" est vidée
    Alors la mailbox de "nono" contient 0 message

    Quand j'ouvre le site
    Et que je clique sur le bouton "Créer un compte" du "header"
    Alors le "formulaire de création de compte" est visible

    # étape 1 : saisie email/mdp
    Quand je clique sur le bouton "Compte sans mot de passe"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | nono@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément             | Condition |
      | header              | visible   |
      | home                | absent    |
      | message lien envoyé | visible   |
    Et la mailbox de "nono" contient 1 message
    Et le dernier message dans la mailbox de "nono" contient le texte "Valider mon inscription"

    # étape 2 : validation du code OTP (pré-rempli depuis le lien)
    Quand je visite le lien contenu dans le dernier message de la mailbox de "nono"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "nono"

    Quand je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de création de compte | visible   |

    # étape 3 : saisie infos sur l'utilisateur + validation CGU
    Quand je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ     | Valeur     |
      | nom       | Dodo       |
      | prenom    | Nono       |
      | telephone | 0123456789 |
    Et que je clique sur le bouton "cgu" du "formulaire de création de compte"
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de connexion          | absent    |
      | formulaire de création de compte | absent    |
      | toutes les collectivités         | absent    |
      | finaliser mon inscription        | visible   |
      | footer                           | présent   |

  Scénario: Tenter de créer un compte sans mot de passe avec un email qui existe déjà revient à se connecter
    Etant donné que la mailbox de "yolo" est vidée
    Alors la mailbox de "yolo" contient 0 message

    Quand j'ouvre le site
    Et que je clique sur le bouton "Créer un compte" du "header"
    Alors le "formulaire de création de compte" est visible

    # étape 1 : saisie email/mdp
    Quand je clique sur le bouton "Compte sans mot de passe"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yolo@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément             | Condition |
      | header              | visible   |
      | home                | absent    |
      | message lien envoyé | visible   |
    Et la mailbox de "yolo" contient 1 message
    Et le dernier message dans la mailbox de "yolo" contient le texte "Me connecter"

    # étape 2 : saisie code OTP
    Quand je visite le lien contenu dans le dernier message de la mailbox de "yolo"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "yolo"

    Quand je clique sur le bouton "Valider" du "formulaire de connexion"
    Alors la page vérifie les conditions suivantes :
      | Elément                          | Condition |
      | header                           | visible   |
      | home                             | absent    |
      | formulaire de connexion          | absent    |
      | formulaire de création de compte | absent    |
      | toutes les collectivités         | absent    |
      | le tableau de bord personnel     | visible   |
      | footer                           | présent   |

