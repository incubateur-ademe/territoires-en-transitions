# language: fr

Fonctionnalité: Utiliser les discussions dans une action d'un référentiel
  Scénario: Créer une discussion
    Etant donné que je suis connecté en tant que "yolo"
    Et que les discussions sont réinitialisées
    Et que je suis sur la page "Action ECI" de la collectivité "1" 
    Quand je clique sur l'icône commentaires

    Quand je saisis "Mon premier commentaire" dans le champs nouvelle discussion
    Et que je clique sur "publier" une nouvelle discussion
    Alors le commentaire "Mon premier commentaire" est visible

  Scénario: Répondre à un commentaire
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Action ECI" de la collectivité "1"
    Quand je clique sur l'icône commentaires

    Quand je saisis "Ma réponse" dans le champ répondre d'une discussion
    Et que je clique sur "publier" une nouvelle réponse
    Alors le commentaire "Ma réponse" est visible

    # Afin d'avoir 3 commentaires dans la discussion
    Quand je saisis "Un troisième commentaire" dans le champ répondre d'une discussion
    Et que je clique sur "publier" une nouvelle réponse
    Alors le commentaire "Ma réponse" n'est plus visible

  Scénario: Visualiser les réponses à un commentaire
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Action ECI" de la collectivité "1"
    Quand je clique sur l'icône commentaires
    
    Alors un bouton contenant "1 autre réponse" est visible

    Quand je clique sur le bouton "1 autre réponse"
    Alors le commentaire "Ma réponse" est visible

  Scénario: Fermer et reouvrir une discussion
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Action ECI" de la collectivité "1"
    Quand je clique sur l'icône commentaires

    Quand je clique sur "Fermer" dans une discussion
	  Alors le commentaire "Mon premier commentaire" n'est plus visible

    Quand je change la vue du feed à "Fermés"
	  Alors le commentaire "Mon premier commentaire" est visible

    Quand je clique sur "Rouvrir" dans une discussion
	  Alors le commentaire "Mon premier commentaire" n'est plus visible

    Quand je change la vue du feed à "Ouverts"
	  Alors le commentaire "Mon premier commentaire" est visible

  Scénario: Supprimer un commentaire
    Etant donné que je suis connecté en tant que "yolo"
    Et que je suis sur la page "Action ECI" de la collectivité "1"
    Quand je clique sur l'icône commentaires
  
    Quand je clique sur "Supprimer mon commentaire" du commentaire "Un troisième commentaire"
    Alors le commentaire "Un troisième commentaire" n'est plus visible
    Et le commentaire "Ma réponse" est visible
