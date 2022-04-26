      # language: fr

      Fonctionnalité: Personnaliser le référentiel

      Scénario: Personnaliser le potentiel de points d'une action
      Etant donné que je suis connecté en tant que "yolo"

      Quand je visite le sous-axe "1.2.4" du référentiel "cae" de la collectivité "1"
      Alors le "cartouche de personnalisation" est visible
      Et le "cartouche de personnalisation" vérifie les conditions suivantes :
      | Element              | Condition | Valeur                                  |
      | bouton Personnaliser | visible   |                                         |
      |                      | contient  | Potentiel pour cette action : 12 points |

      Quand je clique sur le bouton "Personnaliser" du "cartouche de personnalisation"
      Alors le "dialogue Personnaliser le potentiel" est visible
      Et le "dialogue Personnaliser le potentiel" vérifie les conditions suivantes :
      | Element   | Condition | Valeur                                  |
      | cartouche | contient  | Potentiel pour cette action : 12 points |
      Et la liste des questions contient les entrées suivantes :
      """
      La collectivité a-t-elle la compétence habitat ?
      binaire: non définie

      Quelle est la part de la collectivité dans la structure compétente en matière de logement et d'habitat ?
      proportion: non définie
      """
