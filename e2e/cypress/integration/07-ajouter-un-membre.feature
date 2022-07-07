# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité

  Scénario: Envoyer une invitation à rejoindre une collectivité
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Gestion des membres" de la collectivité "1"
    Alors un lien d'invitation est affiché

    Quand je clique sur le bouton "Copier"
    Alors le presse-papier contient le lien copié

  Scénario: Ouvrir un lien d'invitation sans être connecté
    Etant donné que j'ouvre un lien d'invitation
    Alors le "formulaire de connexion" est visible

    Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
      | Champ | Valeur        |
      | email | yili@didi.com |
      | mdp   | yilididi      |
    Et que je clique sur le bouton "Valider" du "formulaire de connexion"
