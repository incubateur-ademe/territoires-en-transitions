# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité

  Scénario: Inviter un email qui est déjà associé à un utilisateur
    Etant donné que les droits utilisateur sont réinitialisés
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un formulaire d'invitation est affiché

    Quand je renseigne l'email "yulu@dudu.com" de la personne à inviter en "edition"
    Et que je valide le formulaire
    Alors une alerte de "succès" est affichée et contient "Nouveau membre ajouté avec succès à la collectivité !"
    Alors le tableau des membres doit contenir l'utilisateur "yulu@dudu.com"

  Scénario: Inviter un email qui est déjà associé à un membre de la collectivité
    Etant donné que les droits utilisateur sont réinitialisés
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un formulaire d'invitation est affiché

    Quand je renseigne l'email "yili@didi.com" de la personne à inviter en "edition"
    Et que je valide le formulaire
    Alors une alerte de "information" est affichée et contient "L'utilisateur est déjà associé à cette collectivité."

  Scénario: Inviter un email qui n'est encore associé à un compte utilisateur
    Etant donné que les droits utilisateur sont réinitialisés
    Et que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un formulaire d'invitation est affiché

    Quand je renseigne l'email "youlou@doudou.com" de la personne à inviter en "admin"
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

    Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yulu@dudu.com |
      | mdp   | yulududu      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"

    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | header                                | visible   |
      | home                                  | absent    |
      | formulaire de connexion               | absent    |
      | le tableau de bord de la collectivité | visible   |
      | footer                                | visible   |

