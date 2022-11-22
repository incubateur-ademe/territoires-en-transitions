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

  Scénario: Rejoindre une collectivité qui n'est pas activée
    Etant donné que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je visite la vue "Rejoindre une collectivité"
    Alors le "formulaire rejoindre une collectivité" est visible

    Quand je sélectionne "Partenaire" dans le champ "SelectFonction"
    Alors le champ "SelectFonction" doit contenir "partenaire"

    Quand je recherche la collectivité "Ablis" dans le champ "collectivite"
    Alors une alerte contient le titre "Accès admin"

    Quand je clique sur le bouton "Rejoindre en tant qu'admin"
    Alors une alerte contient le message "Vous êtes désormais membre de la collectivité Ablis avec un accès admin."

    Quand je clique sur le lien du formulaire
    Alors la collectivité "Ablis" apparait dans le dropdown de sélection avec les droits d'accès relatifs à ma Fonction

  Scénario: Rejoindre une collectivité déjà activée
    Etant donné que les informations des membres sont réinitialisées
    Et que je suis connecté en tant que "yolo"

    Quand je visite la vue "Rejoindre une collectivité"
    Alors le "formulaire rejoindre une collectivité" est visible

    Quand je recherche la collectivité "Ambérieu-en-Bugey" dans le champ "collectivité"
    Alors une alerte contient le titre "Collectivité déjà activée"

    Quand je clique sur le lien du formulaire
    Alors la page vérifie les conditions suivantes :
      | Elément                               | Condition |
      | le tableau de bord de la collectivité | visible   |
