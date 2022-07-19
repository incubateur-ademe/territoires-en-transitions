# language: fr

Fonctionnalité: Ajouter un membre au profil de la collectivité

  Scénario: Générer puis utiliser un lien d'invitation à rejoindre une collectivité
    Etant donné que les droits utilisateur sont réinitialisés
    Et que je suis connecté en tant que "yolo"

    Quand je visite la vue "Mes collectivités"
    Alors la page contient les collectivités "Ambérieu-en-Bugey, Arbent"

# TODO : update this scenario to use the new invitation flow
# Quand je suis sur la page "Gestion des membres" de la collectivité "1"
# Alors un lien d'invitation est affiché

# Quand je clique sur le bouton "Copier"
# Alors le presse-papier contient le lien copié

# Quand je me déconnecte
# Alors la page "home" est visible

# Quand je visite le lien copié
# Alors le "formulaire de connexion" est visible

# Quand je remplis le "formulaire de connexion" avec les valeurs suivantes :
#   | Champ | Valeur        |
#   | email | yulu@dudu.com |
#   | mdp   | yulududu      |
# Et que je clique sur le bouton "Valider" du "formulaire de connexion"
# Alors la page "Mes collectivités" est visible
# Et la page ne contient aucune collectivité

# Quand je visite le lien copié
# Alors la page "Mes collectivités" est visible
# Et la page contient la collectivité "Ambérieu-en-Bugey"
