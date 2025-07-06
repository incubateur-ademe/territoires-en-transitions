# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité


  Scénario: Inviter un email qui est déjà associé à un utilisateur
    Etant donné que je suis connecté en tant que "yolo"
    Et que la mailbox de "yulu" est vidée

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres n'inclus pas l'utilisateur "yulu@dudu.com"

    Quand je clique sur le bouton "Inviter un membre"
    Et que je renseigne l'email "yulu@DUDU.com" de la personne à inviter en "edition"
    Et que je valide le formulaire
    Alors une notification de type "succès" est affichée et contient "Nouveau membre ajouté avec succès à la collectivité !"
    Et le tableau des membres doit contenir l'utilisateur "yulu@dudu.com"
    Et la mailbox de "yulu" contient 1 message

  Scénario: Inviter un email qui est déjà associé à un membre de la collectivité
    Etant donné que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir l'utilisateur "yili@didi.com"

    Quand je clique sur le bouton "Inviter un membre"
    Et que je renseigne l'email "YiLI@didi.com" de la personne à inviter en "edition"
    Et que je valide le formulaire
    Alors le tableau des membres doit contenir l'utilisateur "yili@didi.com"
    Et une notification de type "information" est affichée et contient "L'utilisateur est déjà associé à cette collectivité."

  Scénario: Inviter un email qui n'est pas encore associé à un compte utilisateur
    Etant donné que je suis connecté en tant que "yolo"
    Et que la mailbox de "nono" est vidée

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres n'inclus pas l'utilisateur "nodo@dodo.com"

    Quand je clique sur le bouton "Inviter un membre"
    Et que je renseigne l'email "NoNo@dodo.com" de la personne à inviter en "admin"
    Et que je valide le formulaire
    Alors le tableau des membres indique que le compte "nono@dodo.com" est en attente de création
    Et une notification de type "succès" est affichée et contient "L'invitation à rejoindre la collectivité Ambérieu-en-Bugey a bien été envoyée à nono@dodo.com"

    Quand je me déconnecte
    Alors la page "home" est visible

    Quand je visite le lien contenu dans le dernier message de la mailbox de "nono"
    Alors le "formulaire de création de compte" est visible
    Et le "formulaire de création de compte" vérifie les conditions suivantes :
      | Champ | Condition          | Valeur        |
      | email | contient la valeur | nono@dodo.com |

    Quand je clique sur le bouton "Compte sans mot de passe"
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
      | Elément                      | Condition |
      | header                       | visible   |
      | home                         | absent    |
      | formulaire de connexion      | absent    |
      | le tableau de bord personnel | visible   |

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres doit contenir l'utilisateur "nono@dodo.com"

  Scénario: Inviter un email qui est déjà associé à un utilisateur puis supprimer le rattachement
    Etant donné que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors le tableau des membres n'inclus pas l'utilisateur "yulu@dudu.com"

    Quand je clique sur le bouton "Inviter un membre"
    Et que je renseigne l'email "yulu@DUDU.com" de la personne à inviter en "edition"
    Et que je valide le formulaire
    Alors le tableau des membres doit contenir l'utilisateur "yulu@dudu.com"

    Quand je clique sur le bouton "supprimer" de "yulu@dudu.com"
    Et que je clique sur le bouton "Valider" de la modale
    Alors le tableau des membres ne doit pas contenir l'utilisateur "yulu@dudu.com"
