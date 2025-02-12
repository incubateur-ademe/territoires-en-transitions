# language: fr
Fonctionnalité: Associer une collectivité à mon compte

  Scénario: Sélectionner la première collectivité à associer à mon compte (cas d'une collectivité déjà activée)
    Etant donné que je suis connecté en tant que "yulu"
    Quand je clique sur le bouton "menu collectivités"
    Et que je clique sur le bouton "Associer une collectivité à mon compte"
    Alors je suis redirigé sur l'authentification
    Et le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | vide      |
      | Valider                                               | désactivé |
      | vous ne trouvez pas la collectivité que vous cherchez | absent    |

    Quand je sélectionne l'option "772" dans la liste déroulante "Nom de la collectivité"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                                               | Condition |
      | Nom de la collectivité                                | Afa       |
      | vous ne trouvez pas la collectivité que vous cherchez | absent    |
      | Valider                                               | désactivé |

    Quand je sélectionne l'option "partenaire" dans la liste déroulante "Rôle"
    Alors le "dialogue Associer une collectivité à mon compte" vérifie les conditions suivantes :
      | Element                | Condition  |
      | Nom de la collectivité | Afa        |
      | Rôle                   | Partenaire |
      | Valider                | activé     |

    Quand je clique sur le bouton "Valider" du "dialogue Associer une collectivité à mon compte"
    Alors je suis redirigé sur l'app
    Et le "dialogue Associer une collectivité à mon compte" est absent
    Et la page "Accueil" est visible

  Scénario: Rejoindre une collectivité qui n'est pas activée
    Etant donné que je suis connecté en tant que "yolo"

    Quand je visite la vue "Mon compte"
    Et que je clique sur le lien "Rejoindre une collectivité"
    Alors le "dialogue Associer une collectivité à mon compte" est visible

    Quand je sélectionne l'option "partenaire" dans la liste déroulante "Rôle"
    Alors "Rôle" contient "Partenaire"

    Quand je recherche la collectivité "Ablis" dans le champ "select-collectivite"
    Et que je clique sur le bouton "Valider" du "dialogue Associer une collectivité à mon compte"
    Alors je suis redirigé sur l'app
    Et la collectivité "Ablis" apparait dans le dropdown de sélection avec les droits d'accès relatifs à ma Fonction

  Scénario: Rejoindre une collectivité déjà activée
    Etant donné que je suis connecté en tant que "yolo"

    Quand je visite la vue "Mon compte"
    Et que je clique sur le lien "Rejoindre une collectivité"
    Alors le "dialogue Associer une collectivité à mon compte" est visible

    Quand je recherche la collectivité "Ambérieu-en-Bugey" dans le champ "select-collectivite"
    Alors le "dialogue Associer une collectivité à mon compte" contient "Contactez l'une des personnes admin par mail pour recevoir un lien d’invitation"
    Et le bouton "Valider" du "dialogue Associer une collectivité à mon compte" est désactivé
