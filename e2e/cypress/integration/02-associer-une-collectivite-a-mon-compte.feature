# language: fr

Fonctionnalité: Associer une collectivité à mon compte

  Scénario: Sélectionner la première collectivité à associer à mon compte (cas d'une collectivité déjà activée)
    Etant donné que je suis connecté en tant que "yulu"

    Quand je visite la vue "Toutes les collectivités"
    Et que je clique sur le bouton "Associer une collectivité à mon compte"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | vide      |
      | vous ne trouvez pas la collectivité que vous cherchez | visible   |

    Quand je remplis le "dialogue Associer une collectivité à mon compte" avec les valeurs suivantes :
      | Champ                  | Valeur                |
      | Nom de la collectivité | Afa{downarrow}{enter} |

    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | Afa       |
      | vous ne trouvez pas la collectivité que vous cherchez | absent    |
      | dialogue Rejoindre cette collectivité                 | visible   |

    Quand je clique en dehors de la boîte de dialogue
    Alors le "dialogue Associer une collectivité à mon compte" vérifie la condition "absent"

    Quand je clique sur le bouton "Associer une collectivité à mon compte"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                               | Condition | Valeur |
      | dialogue Rejoindre cette collectivité | visible   |        |


  Scénario: Rejoindre une collectivité déjà activée
    Etant donné que je suis connecté en tant que "yolo"

    Quand je suis sur la page "Tableau de bord" de la collectivité "3"

    Quand je clique sur le bouton "Rejoindre cette collectivité"
    Alors le "dialogue Rejoindre cette collectivité" vérifie les conditions suivantes :
      | Elément                                | Condition | Valeur        |
      | Contenu pour rejoindre la collectivité | contient  | yala@dada.com |
