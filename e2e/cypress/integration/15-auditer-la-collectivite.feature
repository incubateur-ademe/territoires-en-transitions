# language: fr

Fonctionnalité: Auditer la collectivité

  Scénario: Suivre l'audit en tant qu'auditeur
    Etant donné que je suis connecté en tant que "youlou"

    Quand je suis sur la page "Labellisation ECi" de la collectivité "1"
    Alors je vois 3 onglets
    Et l'onglet "Suivi de l'audit" est sélectionné
    Et le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement     |
      | 1.1         |                      | Non audité     |
      | 1.2         |                      | Non audité     |
      | 1.3         |                      | Non audité     |
      | 2.1         |                      | Non audité     |
      | 2.2         | oui                  | Audit en cours |
      | 2.3         |                      | Audité         |
      | 2.4         | oui                  | Non audité     |
      | 2.5         |                      | Non audité     |

    Quand je clique sur la ligne du tableau de suivi de l'audit contenant l'identifiant "2.1"
    Alors l'état d'avancement des tâches est éditable
    Et la page vérifie les conditions suivantes :
      | Elément                         | Condition | Valeur     |
      | état audit action               | contient  | Non audité |
      | état audit action lecture seule | absent    |            |
      | avis audit                      | vide      |            |
      | avis audit                      | activé    |            |
      | ajouter à l'ordre du jour       | décoché   |            |
      | ajouter à l'ordre du jour       | activé    |            |

    Quand je sélectionne l'option "en_cours" dans la liste déroulante "état audit action"
    Et que je saisi la valeur "mon commentaire d'audit" dans le champ "avis audit"
    Et que je clique sur la case "ajouter à l'ordre du jour"
    Alors la page vérifie les conditions suivantes :
      | Elément                   | Condition | Valeur                  |
      | état audit action         | contient  | Audit en cours          |
      | avis audit                | contient  | mon commentaire d'audit |
      | ajouter à l'ordre du jour | coché     |                         |

    Quand je suis sur la page "Labellisation ECi" de la collectivité "1"
    Alors le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement     |
      | 1.1         |                      | Non audité     |
      | 1.2         |                      | Non audité     |
      | 1.3         |                      | Non audité     |
      | 2.1         | oui                  | Audit en cours |
      | 2.2         | oui                  | Audit en cours |
      | 2.3         |                      | Audité         |
      | 2.4         | oui                  | Non audité     |
      | 2.5         |                      | Non audité     |

    Quand je visite l'onglet "detail" du référentiel "eci" de la collectivité "1"
    Alors l'état d'avancement est éditable depuis le tableau de détail des tâches

  Scénario: Suivre l'audit en tant que non auditeur
    Etant donné que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Labellisation ECi" de la collectivité "1"
    Alors le bouton "Valider l'audit" est absent
    Et l'en-tête contient "Audit en cours"
    Et je vois 3 onglets
    Et l'onglet "Suivi de l'audit" est sélectionné
    Et le tableau de suivi de l'audit contient les lignes suivantes :
      | identifiant | inscrit séance audit | avancement     |
      | 1.1         |                      | Non audité     |
      | 1.2         |                      | Non audité     |
      | 1.3         |                      | Non audité     |
      | 2.1         |                      | Non audité     |
      | 2.2         | oui                  | Audit en cours |
      | 2.3         |                      | Audité         |
      | 2.4         | oui                  | Non audité     |
      | 2.5         |                      | Non audité     |

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

    Quand je visite l'onglet "detail" du référentiel "eci" de la collectivité "1"
    Alors l'état d'avancement n'est pas éditable depuis le tableau de détail des tâches

  Scénario: Ajouter un rapport et valider l'audit
    Etant donné que je suis connecté en tant que "youlou"

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Alors il n'y a pas de documents de labellisation

    Quand je suis sur la page "Labellisation ECi" de la collectivité "1"
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
    Et l'en-tête contient "Labellisation en cours"

    Quand je suis sur la page "Bibliothèque de documents" de la collectivité "1"
    Alors la liste des documents de labellisation contient les lignes suivantes :
      # audit validé => le document est en lecture seule
      | Titre       | Commentaire | Lecture seule |
      | rapport.doc |             | oui           |
#    Et la liste des documents de labellisation contient le titre "Audit contrat d'objectif territorial (COT)" sans l'indication "en cours"
