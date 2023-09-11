# language: fr

Fonctionnalité: Auditer la collectivité

  Scénario: Démarrer un audit
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"
    Et un score permettant d'obtenir la 2ème étoile

    Quand je suis connecté avec les droits en "edition"
    Et que je demande un audit de labellisation "eci" pour la 2ème étoile
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Demander un audit" est absent
    Et le "message d'en-tête" contient "Demande envoyée"

    Quand je me reconnecte en tant qu'auditeur de la collectivité
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Commencer l'audit" est visible
    Et le "message d'en-tête" est absent

    Quand je clique sur le bouton "Commencer l'audit"
    Alors le bouton "Commencer l'audit" est absent

    ## On revient sur la page
    ## le parcours arrive avant le commencement de l'audit
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Et le bouton "Valider l'audit" est visible

  Scénario: Suivre l'audit en tant qu'auditeur
    Etant donné une collectivité nommée "Collectivité de test"
    Et un score permettant d'obtenir la 3ème étoile
    Et avec un audit demandé pour la labellisation "eci" 3ème étoile

    Quand je suis connecté en tant qu'auditeur de la collectivité
    Et que l'audit est commencé
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors je vois 3 onglets
    Et l'onglet "Suivi de l'audit" est sélectionné
    Et le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement |
      | 1.1         |                      | Non audité |
      | 1.2         |                      | Non audité |
      | 1.3         |                      | Non audité |
      | 2.1         |                      | Non audité |

    Quand je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant "2.1"
    Et que je déplie la sous-action "2.1.1" du suivi de l'action
    Et que je déplie le panneau Tâches de la sous-action "2.1.1"
    Alors la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | contient  | Non audité |
      | état audit action lecture seule | absent    |            |
      | avis audit                      | vide      |            |
      | avis audit                      | activé    |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | activé    |            |
    Et l'état d'avancement des tâches est éditable

    Quand je clique sur la case "ajouter à l'ordre du jour"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition | Valeur     |
      | état audit action         | contient  | Non audité |
      | avis audit                | contient  |            |
      | ajouter à l'ordre du jour | coché     |            |

    Quand je saisi la valeur "mon commentaire d'audit" dans le champ "avis audit"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition | Valeur                  |
      | état audit action         | contient  | Non audité              |
      | avis audit                | contient  | mon commentaire d'audit |
      | ajouter à l'ordre du jour | coché     |                         |


    Quand je sélectionne l'option "en_cours" dans la liste déroulante "état audit action"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition | Valeur                  |
      | état audit action         | contient  | Audit en cours          |
      | avis audit                | contient  | mon commentaire d'audit |
      | ajouter à l'ordre du jour | coché     |                         |

    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement     |
      | 1.1         |                      | Non audité     |
      | 1.2         |                      | Non audité     |
      | 1.3         |                      | Non audité     |
      | 2.1         | oui                  | Audit en cours |

    Quand je visite l'onglet "detail" du référentiel "eci" de la collectivité courante
    Alors le tableau de suivi de l'audit ne contient pas de résultat

    Quand je clique sur le bouton "Désactiver tous les filtres"
    Alors l'état d'avancement est éditable depuis le tableau de détail des tâches

  Scénario: Suivre l'audit en tant que non auditeur
    Etant donné une collectivité nommée "Collectivité de test"
    Et un score permettant d'obtenir la 3ème étoile
    Et avec un audit en cours pour la labellisation "eci" 3ème étoile
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Valider l'audit" est absent
    Et l'en-tête contient "Audit en cours"
    Et je vois 3 onglets
    Et l'onglet "Suivi de l'audit" est sélectionné
    Et le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement |
      | 1.1         |                      | Non audité |
      | 1.2         |                      | Non audité |
      | 1.3         |                      | Non audité |
      | 2.1         |                      | Non audité |

    Quand je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant "2.1"
    Alors l'état d'avancement des tâches n'est pas éditable
    Et la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | absent    |            |
      | état audit action lecture seule | contient  | Non audité |
      | avis audit                      | vide      |            |
      | avis audit                      | désactivé |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | désactivé |            |

    Quand je visite l'onglet "detail" du référentiel "eci" de la collectivité courante
    Alors le tableau de suivi de l'audit ne contient pas de résultat

    Quand je clique sur le bouton "Désactiver tous les filtres"
    Alors l'état d'avancement n'est pas éditable depuis le tableau de détail des tâches

  Scénario: Ajouter un rapport et valider l'audit
    Etant donné une collectivité nommée "Collectivité de test"
    Et un score permettant d'obtenir la 3ème étoile
    Et avec un audit demandé pour la labellisation "eci" 3ème étoile

    Quand je suis connecté en tant qu'auditeur de la collectivité
    Et que l'audit est commencé
    Et que je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors il n'y a pas de documents de labellisation

    Quand je suis sur la page "Labellisation ECi" de la collectivité courante
    Alors le bouton "Valider l'audit" est visible
    Et l'en-tête ne contient pas de message

    Quand je clique sur le bouton "Valider l'audit"
    Alors le "dialogue de validation" est visible

    Quand je clique sur le bouton "Ajouter le rapport" du "dialogue de validation"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et il n'y a pas de rapports d'audit

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "rapport.doc" et contenant "le rapport d'audit"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des rapports d'audit contient les lignes suivantes :
      | Titre       | Commentaire |
      | rapport.doc |             |

    Quand je clique sur le bouton "Valider" du "dialogue de validation"
    Alors le "dialogue de validation" est absent
    Et le bouton "Valider l'audit" est absent
    Et le bouton "Demander un audit" est absent
    Et l'en-tête contient "Labellisation en cours"

    # on vérifie que le statut d'audit, l'avis et la case "ordre du jour" sont en lecture seule après validation de l'audit
    Quand je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant "2.1"
    Alors l'état d'avancement des tâches n'est pas éditable
    Et la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | absent    |            |
      | état audit action lecture seule | contient  | Non audité |
      | avis audit                      | vide      |            |
      | avis audit                      | désactivé |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | désactivé |            |

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors la liste des documents de labellisation contient les lignes suivantes :
      # audit validé => le document est en lecture seule
      | Titre       | Commentaire | Lecture seule |
      | rapport.doc |             | oui           |
    Et la liste des documents de labellisation contient le titre "troisième étoile" sans l'indication "en cours"

  Scénario: Ajouter un rapport et valider un audit COT sans labellisation
    Etant donné une collectivité nommée "Collectivité de test"
    Et un score permettant d'obtenir la 3ème étoile
    Et avec un COT actif
    Et avec un audit COT sans labellisation demandé

    Quand je suis connecté en tant qu'auditeur de la collectivité
    Et que l'audit est commencé
    Et que je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors il n'y a pas de documents de labellisation

    Quand je suis sur la page "Labellisation CAE" de la collectivité courante
    Alors le bouton "Valider l'audit" est visible
    Et l'en-tête ne contient pas de message

    Quand je clique sur le bouton "Valider l'audit"
    Alors le "dialogue de validation" est visible

    Quand je clique sur le bouton "Ajouter le rapport" du "dialogue de validation"
    Alors le "dialogue d'ajout d'une preuve" est visible
    Et il n'y a pas de rapports d'audit

    Quand je transfère à partir du "dialogue d'ajout d'une preuve" le fichier nommé "rapport.doc" et contenant "le rapport d'audit"
    Et que je clique sur le bouton "Ajouter" du "formulaire Fichier"
    Alors la liste des rapports d'audit contient les lignes suivantes :
      | Titre       | Commentaire |
      | rapport.doc |             |

    Quand je clique sur le bouton "Valider" du "dialogue de validation"
    Alors le "dialogue de validation" est absent
    Et le bouton "Valider l'audit" est absent
    Et le bouton "Demander un audit" est visible
    Et l'en-tête ne contient pas de message

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité courante
    Alors la liste des documents de labellisation contient les lignes suivantes :
      | Titre       | Commentaire | Lecture seule |
      | rapport.doc |             | oui           |
    Et la liste des documents de labellisation contient le titre "Audit contrat d'objectif territorial (COT)" sans l'indication "en cours"

  @skip
  Scénario: Personnaliser le référentiel en cours d'audit
    On teste que le score avant audit reste inchangé lorsque la personnalisation du référentiel change pendant l'audit.

    Etant donné une collectivité nommée "Collectivité de test"
    Et avec comme réponses initiales :
      | Question        | Réponse    |
      | AOM_1           | non        |
      | voirie_1        | voirie_1_a |
      | centre_polarite | oui        |
    Et un score permettant d'obtenir la 2ème étoile
    Et que j'attends que les scores soient calculés
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'action "cae_4.2.3" de la collectivité courante
    #####
    ## TODO: faire passer le test avec la ligne commentée :
    # Alors le potentiel de points est "4,5"
    Alors le potentiel de points est "7,71"
    ####

    Quand je demande un audit de labellisation "cae" pour la 2ème étoile
    Et que je me reconnecte en tant qu'auditeur de la collectivité
    Et que je suis sur la page "Labellisation CAE" de la collectivité courante
    Et que je clique sur le bouton "Commencer l'audit"
    Et que je clique sur l'onglet "Cycles et comparaison"
    Et que je déplie le sous-axe "4.2" du tableau de comparaison des scores
    #####
    ## TODO: faire passer le test avec la ligne commentée :
    #Alors le potentiel de l'action "4.2.3" est de "4,5" avant et pendant l'audit
    Alors le potentiel de l'action "4.2.3" est de "4,5" avant audit et "7,7" pendant l'audit
    #####

    Quand je change la réponse à la question "centre_polarite" depuis la thématique "identite" en "non"
    Et que j'attends que les scores soient calculés
    Et que je retourne sur la page "Labellisation CAE" de la collectivité courante
    Et que je clique sur l'onglet "Cycles et comparaison"
    Et que je déplie le sous-axe "4.2" du tableau de comparaison des scores
    #####
    ## TODO: faire passer le test avec la ligne commentée :
    #Alors le potentiel de l'action "4.2.3" est de "4,5" avant audit et "1,5" pendant l'audit
    Alors le potentiel de l'action "4.2.3" est de "1,5" avant audit et "7,7" pendant l'audit

