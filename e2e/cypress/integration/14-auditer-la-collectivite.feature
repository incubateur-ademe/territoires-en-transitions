# language: fr

Fonctionnalité: Auditer la collectivité

  Scénario: Suivre l'audit en tant qu'auditeur
    Etant donné que je suis connecté en tant que "youlou"

    Quand je suis sur la page "Labellisation ECi" de la collectivité "1"
    Alors je vois 2 onglets
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
    Alors je vois 2 onglets
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
