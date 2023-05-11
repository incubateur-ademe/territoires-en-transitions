# language: fr

Fonctionnalité: Personnaliser le référentiel

  Scénario: Filtrer et naviguer entre les thématiques de personnalisation
    Etant donné une collectivité nommée "Ma collectivité"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Personnalisation des référentiels" de la collectivité courante
    # vérifie les filtres et le nombre de thématiques avant filtrage
    Alors la case "Climat Air Energie" est cochée
    Et la case "Economie Circulaire" est cochée
    Et la page contient plus de 5 thématiques

    # et après filtrage
    Quand je clique sur la case "Climat Air Energie"
    Alors la case "Climat Air Energie" est décochée
    Et la case "Economie Circulaire" est cochée
    Et la page contient moins de 5 thématiques

    # on navigue dans les thématiques
    Quand je clique sur la dernière thématique
    Alors le bouton "Revenir au sommaire" est affiché
    Et le bouton "Catégorie suivante" est absent

    # et on vérifie que le filtrage est conservé quand on revient au sommaire
    Quand je clique sur le bouton "Revenir au sommaire"
    Alors la case "Climat Air Energie" est décochée
    Et la case "Economie Circulaire" est cochée
    Et la page contient moins de 5 thématiques

    # quand on navigue de thématique...
    Quand je clique sur l'avant-dernière thématique
    Alors le bouton "Revenir au sommaire" est affiché
    Et le bouton "Catégorie suivante" est affiché

    # ... en thématique
    Quand je clique sur le bouton "Catégorie suivante"
    Alors le bouton "Revenir au sommaire" est affiché
    Et le bouton "Catégorie suivante" est absent

    # puis on vérifie à nouveau le filtrage quand on revient au sommaire
    Quand je clique sur le bouton "Revenir au sommaire"
    Alors la case "Climat Air Energie" est décochée
    Et la case "Economie Circulaire" est cochée
    Et la page contient moins de 5 thématiques

    # puis après retour à l'état initial
    Quand je clique sur la case "Climat Air Energie"
    Alors la case "Climat Air Energie" est cochée
    Et la case "Economie Circulaire" est cochée
    Et la page contient plus de 5 thématiques

  Scénario: Personnaliser le potentiel de points d'une action à partir de la vue Action
    Etant donné que je suis connecté en tant que "yolo"

    # vérifie le cartouche de personnalisation sur la vue Action
    Quand je visite le sous-axe "4.3.3" du référentiel "cae" de la collectivité "1"
    Alors le "cartouche de personnalisation" est visible
    Et le "cartouche de personnalisation" vérifie les conditions suivantes :
      | Element              | Condition | Valeur                |
      | bouton Personnaliser | visible   |                       |
      |                      | contient  | Potentiel : 14 points |

    # et dans le dialogue de personnalisation
    Quand je clique sur le bouton "Personnaliser" du "cartouche de personnalisation"
    Alors le "dialogue Personnaliser le potentiel" est visible
    Et le "dialogue Personnaliser le potentiel" vérifie les conditions suivantes :
      | Element   | Condition | Valeur                |
      | cartouche | contient  | Potentiel : 14 points |
    Et la liste des questions contient les entrées suivantes :
      """
      Quelle est la part de la collectivité autorité organisatrice de la mobilité (AOM) ?
      part: non définie

      La collectivité est-elle concernée par le versement mobilité ?
      binaire: non définie
      """

    # et sur la page "Personnalisation des référentiels"
    Quand je suis sur la page "Personnalisation des référentiels" de la collectivité "1"
    Et que je clique sur la thématique "Mobilité"
    Alors la page thématique contient entre autres les questions suivantes :
      """
      Quelle est la part de la collectivité autorité organisatrice de la mobilité (AOM) ?
      part: non définie

      La collectivité est-elle concernée par le versement mobilité ?
      binaire: non définie
      """

    # puis on modifie les réponses à partir du dialogue sur la page Action
    Quand je visite le sous-axe "4.3.3" du référentiel "cae" de la collectivité "1"
    Et que je clique sur le bouton "Personnaliser" du "cartouche de personnalisation"
    Et que je complète les questions avec les valeurs suivantes :
      """
      Quelle est la part de la collectivité autorité organisatrice de la mobilité (AOM) ?
      part: 70

      La collectivité est-elle concernée par le versement mobilité ?
      binaire: non
      """
    # et on vérifie les nouvelles valeurs dans le dialogue de personnalisation
    Alors le "dialogue Personnaliser le potentiel" vérifie les conditions suivantes :
      | Element   | Condition | Valeur                      |
      | cartouche | contient  | Potentiel réduit : 7 points |

    # puis dans le cartouche de personnalisation
    Quand je clique en dehors de la boîte de dialogue
    Alors le "cartouche de personnalisation" vérifie les conditions suivantes :
      | Element              | Condition | Valeur                      |
      | bouton Personnaliser | visible   |                             |
      |                      | contient  | Potentiel réduit : 7 points |

    # et enfin la page Personnalisation
    Quand je suis sur la page "Personnalisation des référentiels" de la collectivité "1"
    Et que je clique sur la thématique "Mobilité"
    Alors la page thématique contient entre autres les questions suivantes :
      """
      Quelle est la part de la collectivité autorité organisatrice de la mobilité (AOM) ?
      part: 70

      La collectivité est-elle concernée par le versement mobilité ?
      binaire: non
      """

  Scénario: Répondre aux questions de personnalisation
    Etant donné que je suis connecté en tant que "yolo"

    # vérifie la page Action et le dialogue de personnalisation de cette page
    Quand je visite le sous-axe "4.3.1" du référentiel "cae" de la collectivité "1"
    Et le "cartouche de personnalisation" vérifie les conditions suivantes :
      | Element              | Condition | Valeur                |
      | bouton Personnaliser | visible   |                       |
      | cartouche            | contient  | Potentiel : 12 points |

    Quand je clique sur le bouton "Personnaliser" du "cartouche de personnalisation"
    Alors le "dialogue Personnaliser le potentiel" est visible
    Et le "dialogue Personnaliser le potentiel" vérifie les conditions suivantes :
      | Element   | Condition | Valeur                |
      | cartouche | contient  | Potentiel : 12 points |
    Et la liste des questions contient les entrées suivantes :
      """
      La collectivité a-t-elle la compétence voirie ?
      choix(3): non définie

      Si la commune a transféré la compétence voirie
      part: non définie
      """

    # puis vérifie la page "Personnalisation des référentiels"
    Quand je suis sur la page "Personnalisation des référentiels" de la collectivité "1"
    Et que je clique sur la thématique "Mobilité"
    Alors la page thématique contient entre autres les questions suivantes :
      """
      La collectivité a-t-elle la compétence voirie ?
      choix(3): non définie
      """

    # réponds aux questions et vérifie les valeurs sur la page
    Quand je complète les questions avec les valeurs suivantes :
      """
      La collectivité a-t-elle la compétence voirie ?
      choix(3): voirie_1_b
      """
    Alors la page thématique contient entre autres les questions suivantes :
      """
      La collectivité a-t-elle la compétence voirie ?
      choix(3): voirie_1_b
      """

    # puis vérifie le cartouche et le dialogue de personnalisation
    Quand je visite le sous-axe "4.3.1" du référentiel "cae" de la collectivité "1"
    Alors le "cartouche de personnalisation" vérifie les conditions suivantes :
      | Element              | Condition | Valeur                |
      | bouton Personnaliser | visible   |                       |
      | cartouche            | contient  | Potentiel : 12 points |

    Quand je clique sur le bouton "Personnaliser" du "cartouche de personnalisation"
    Alors le "dialogue Personnaliser le potentiel" est visible
    Et le "dialogue Personnaliser le potentiel" vérifie les conditions suivantes :
      | Element   | Condition | Valeur                |
      | cartouche | contient  | Potentiel : 12 points |
    Et la liste des questions contient les entrées suivantes :
      """
      La collectivité a-t-elle la compétence voirie ?
      choix(3): voirie_1_b

      Si la commune a transféré la compétence voirie
      part: non définie
      """

