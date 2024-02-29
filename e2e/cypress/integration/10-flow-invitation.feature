# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité

  Scénario: J'invite Nono qui n'est pas un utilisateur
    Etant donné que je suis connecté en tant que "yolo"
    Et que la mailbox de "nono" est vidée

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un formulaire d'invitation est affiché

    Quand je renseigne l'email "NoNo@dodo.com" de la personne à inviter en "admin"
    Et que je valide le formulaire
    Alors un message d'invitation est affiché

    Quand je clique sur le bouton "Copier le message"
    Alors le presse-papier contient "Yolo Dodo de Ambérieu-en-Bugey vous invite à collaborer."

    Quand je clique sur le bouton "Copier le lien"
    Alors le presse-papier contient "http"

    Quand je me déconnecte
    Alors la page "home" est visible

    Quand je visite le lien copié
    Alors le "formulaire de création de compte" est visible

    Quand je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | nono@dodo.com |
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors le "message lien envoyé" est visible

    Quand je visite le lien contenu dans le dernier message de la mailbox de "nono"
    Alors le champ de saisie du code est pré-rempli avec celui reçu dans la mailbox de "nono"

    Quand je clique sur le bouton "Valider" du "formulaire de création de compte"
    Et que je remplis le "formulaire de création de compte" avec les valeurs suivantes :
      | Champ     | Valeur     |
      | nom       | Dodo       |
      | prenom    | Nono       |
      | telephone | 0123456789 |
    Et que je clique sur le bouton "cgu" du "formulaire de création de compte"
    Et que je clique sur le bouton "Valider" du "formulaire de création de compte"
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | header                                | visible   |
      | home                                  | absent    |
      | formulaire de connexion               | absent    |
      | le tableau de bord de la collectivité | visible   |

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir l'utilisateur "nono@dodo.com"
