# language: fr

Fonctionnalité: Associer une collectivité à mon compte

  Scénario: Sélectionner une collectivité à associer à mon compte
    Etant donné que je suis connecté en tant que "yolo"
    Quand je clique sur le bouton "Associer une collectivité à mon compte" de la page "Mes collectivités"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | vide      |
      | vous ne trouvez pas la collectivité que vous cherchez | visible   |
      | vous souhaitez rejoindre                              | absent    |

    Quand je remplis le "dialogue Associer une collectivité à mon compte" avec les valeurs suivantes :
      | Champ                  | Valeur                |
      | Nom de la collectivité | Afa{downarrow}{enter} |
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | Afa       |
      | vous ne trouvez pas la collectivité que vous cherchez | absent    |
      | vous souhaitez rejoindre                              | visible   |

    Quand je clique en dehors de la boîte de dialogue
    Alors le "dialogue Associer une collectivité à mon compte" vérifie la condition "absent"

    Quand je clique sur le bouton "Associer une collectivité à mon compte" de la page "Mes collectivités"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | vide      |
      | vous ne trouvez pas la collectivité que vous cherchez | visible   |
      | vous souhaitez rejoindre                              | absent    |
