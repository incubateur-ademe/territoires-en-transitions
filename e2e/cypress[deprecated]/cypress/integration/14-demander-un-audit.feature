# language: fr

Fonctionnalité: Demander un audit

  Scénario: Demander un audit COT sans labellisation
    On teste ici que l'envoi d'une demande d'audit COT est possible même quand le critère fichier n'est pas rempli.
    Seule l'option "Audit COT sans labellisation" est disponible dans le dialogue d'envoi de la demande.

    Etant donné une collectivité nommée "Collectivité de test"
    Et avec un COT actif
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est absent

    Quand le score permet d'obtenir la 1ère étoile
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est activé
    Et je ne vois aucun onglet
    Quand je clique sur le bouton "Demander un audit"
    Alors le "choix du type d'audit/labellisation COT" est visible
    Et le bouton "Audit COT sans labellisation" est activé et coché
    Et le bouton "Audit COT avec labellisation" est désactivé et décoché
    Et le bouton "Audit de labellisation" est désactivé et décoché
    Et le bouton "Envoyer ma demande" est activé

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "choix du type d'audit/labellisation COT" contient "Votre demande d’audit a bien été envoyée."
    Alors le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"

  Scénario: Demander un audit COT avec labellisation
    On teste l'envoi d'une demande d'audit COT avec labellisation après avoir rempli le critère fichier.

    Etant donné une collectivité nommée "Collectivité de test"
    Et avec un COT actif
    Et un utilisateur avec les droits en "edition"
    Et que le score permet d'obtenir la 2ème étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est activé
    Et le bouton "Ajouter un document de labellisation" est activé

    Quand je clique sur le bouton "Ajouter un document de labellisation"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "doc labellisation.pdf" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |

    Quand je clique sur le bouton "Demander un audit"
    Alors le "choix du type d'audit/labellisation COT" est visible
    Et le bouton "Audit COT sans labellisation" est activé
    Et le bouton "Audit COT avec labellisation" est activé et décoché
    Et le bouton "Audit de labellisation" est activé et décoché

    Quand je clique sur le bouton radio "Audit COT avec labellisation"
    Alors le bouton "Envoyer ma demande" est activé

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "choix du type d'audit/labellisation COT" contient "Votre demande d’audit a bien été envoyée."

    Quand je clique en dehors de la boîte de dialogue
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"
    Et la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire | Lecture seule |
      | doc labellisation.pdf |             | oui           |

  Scénario: Demander un audit de labellisation (pour une collectivité COT)
    On teste l'envoi d'une demande d'audit de labellisation pour une collectivité COT.

    Etant donné une collectivité nommée "Collectivité de test"
    Et avec un COT actif
    Et un utilisateur avec les droits en "edition"
    Et que le score permet d'obtenir la 3ème étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est activé
    Et le bouton "Ajouter un document de labellisation" est activé

    Quand je clique sur le bouton "Ajouter un document de labellisation"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "doc labellisation.pdf" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors la liste des documents de labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |
    # l'assertion suivante ne passe pas car la demande n'est pas encore envoyée
    # et la vue preuve ne renvoi donc pas l'étoile objectif :
    #Et la liste des documents de labellisation contient le titre "troisième étoile" avec l'indication "en cours"

    Quand je suis sur la page "Labellisation ECi" de la collectivité courante
    Et que je clique sur le bouton "Demander un audit"
    Alors le "choix du type d'audit/labellisation COT" est visible
    Et le bouton "Audit COT sans labellisation" est activé et décoché
    Et le bouton "Audit COT avec labellisation" est activé et décoché
    Et le bouton "Audit de labellisation" est activé et décoché

    Quand je clique sur le bouton radio "Audit de labellisation"
    Alors le bouton "Envoyer ma demande" est activé

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "choix du type d'audit/labellisation COT" contient "Votre demande d’audit a bien été envoyée."

    Quand je clique en dehors de la boîte de dialogue
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"
    Et la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire | Lecture seule |
      | doc labellisation.pdf |             | oui           |

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors la liste des documents de labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |
    Et la liste des documents de labellisation contient le titre "troisième étoile" avec l'indication "en cours"

  Scénario: Demander la 1ère étoile (pour une collectivité COT)
    On teste l'envoi d'une demande de 1ère étoile pour une collectivité COT depuis le bouton dédié.

    Etant donné une collectivité nommée "Collectivité de test"
    Et avec un COT actif
    Et un utilisateur avec les droits en "edition"
    Et que le score permet d'obtenir la 1ère étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander la 1ère étoile" est activé
    Et le bouton "Demander un audit" est activé
    Et le bouton "Ajouter un document de labellisation" est absent

    Quand je clique sur le bouton "Demander la 1ère étoile"
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le "dialogue d'envoi de la demande" est visible

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "dialogue d'envoi de la demande" contient "Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l’ADEME."

    Quand je clique en dehors de la boîte de dialogue
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le "dialogue d'envoi de la demande" est absent
    Et le bouton "Demander la 1ère étoile" est absent
    Et le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"

  Scénario: Demander la 1ère étoile (pour une collectivité sans COT)
    On teste l'envoi d'une demande de 1ère étoile pour une collectivité sans COT.

    Etant donné une collectivité nommée "Collectivité de test"
    Et un utilisateur avec les droits en "edition"
    Et que le score permet d'obtenir la 1ère étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est désactivé
    Et le bouton "Ajouter un document de labellisation" est activé

    Quand je clique sur le bouton "Ajouter un document de labellisation"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "doc labellisation.pdf" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |
    Et le bouton "Demander un audit" est activé

    Quand je clique sur le bouton "Demander un audit"
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le "dialogue d'envoi de la demande" est visible

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "dialogue d'envoi de la demande" contient "Votre demande de labellisation a bien été envoyée. Vous recevrez dans les 48h ouvrées un mail de l’ADEME."

    Quand je clique en dehors de la boîte de dialogue
    Alors le "dialogue d'envoi de la demande" est absent
    Et le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"
    Et la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire | Lecture seule |
      | doc labellisation.pdf |             | oui           |

  Scénario: Demander un audit de labellisation (pour une collectivité sans COT)
    On teste l'envoi d'une demande d'audit de labellisation pour une collectivité sans COT.

    Etant donné une collectivité nommée "Collectivité de test"
    Et un utilisateur avec les droits en "edition"
    Et que le score permet d'obtenir la 3ème étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est désactivé
    Et le bouton "Ajouter un document de labellisation" est activé

    Quand je clique sur le bouton "Ajouter un document de labellisation"
    Et que je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "doc labellisation.pdf" et contenant "contenu du fichier"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire |
      | doc labellisation.pdf |             |
    Et le bouton "Demander un audit" est activé

    Quand je clique sur le bouton "Demander un audit"
    Alors le "choix du type d'audit/labellisation COT" est absent
    Et le "dialogue d'envoi de la demande" est visible

    Quand je clique sur le bouton "Envoyer ma demande"
    Alors le "dialogue d'envoi de la demande" contient "Votre demande d’audit a bien été envoyée."

    Quand je clique en dehors de la boîte de dialogue
    Alors le "dialogue d'envoi de la demande" est absent
    Et le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"
    Et la liste des documents de la page Labellisation contient les lignes suivantes :
      | Titre                 | Commentaire | Lecture seule |
      | doc labellisation.pdf |             | oui           |
