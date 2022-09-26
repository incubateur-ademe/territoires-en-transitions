# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité

  Scénario: J'invite Nono qui n'est pas un utilisateur
    Etant donné que l'utilisateur "nono@dodo.com" est supprimé
    Etant donné que les droits utilisateur sont réinitialisés
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un formulaire d'invitation est affiché

    Quand je renseigne l'email "nono@dodo.com" de la personne à inviter en "admin"
    Et que je valide le formulaire
    Alors un message d'invitation est affiché

    Quand je clique sur le bouton "Copier le message"
    Alors le presse-papier contient "Yolo Dodo de Ambérieu-en-Bugey vous invite à collaborer."

    Quand je clique sur le bouton "Copier le lien"
    Alors le presse-papier contient "/invitation/"

    Quand je me déconnecte
    Alors la page "home" est visible

    Quand je visite le lien copié
    Alors le "formulaire de connexion" est visible

    Quand je clique sur le bouton "Créer un compte" du "header"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ  | Valeur        |
      | email  | nono@dodo.com |
      | mdp    | Noo0000oo00!! |
      | prenom | Nono          |
      | nom    | Dodo          |

    Et que je clique sur le bouton "cgu" du "formulaire de création de compte"
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"

    # ------------
    # Cette partie déco/reco n'a pas lieu d'être mais le flow va changer.
    Quand je me déconnecte
    Et que je clique sur le bouton "Se connecter" du "header"
    Alors la page vérifie les conditions suivantes :
      | Elément                                    | Condition |
      | formulaire de connexion                    | visible   |

    Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | nono@dodo.com |
      | mdp   | Noo0000oo00!! |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
    # ------------

    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | header                                | visible   |
      | home                                  | absent    |
      | formulaire de connexion               | absent    |
      | le tableau de bord de la collectivité | visible   |
      | footer                                | visible   |


    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir l'utilisateur "nono@dodo.com"




