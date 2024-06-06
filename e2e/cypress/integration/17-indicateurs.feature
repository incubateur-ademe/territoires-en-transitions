# language: fr

Fonctionnalité: Visualiser et éditer les indicateurs

  Scénario: Visualiser une liste d'indicateurs prédéfinis
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Indicateurs CAE" de la collectivité courante
    Alors la page contient au moins 2 graphiques vides

  Scénario: Editer un indicateur prédéfini
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide
    Et le badge "À compléter" est visible
    Et le badge "Complété" est absent
    Et la page vérifie les conditions suivantes :
      | Elément         | Condition | Valeur |
      | Personne pilote | contient  |        |
      | Service pilote  | contient  |        |
      | Description     | absent    |        |
      | Thématique      | absent    |        |

    Quand je crée un tag "Michel Sapasse" avec le sélecteur de tag "personnes"
    Et que je crée un tag "Un service" avec le sélecteur de tag "ServicePilote"
    Alors la page vérifie les conditions suivantes :
      | Elément         | Condition | Valeur         |
      | Personne pilote | contient  | Michel Sapasse |
      | Service pilote  | contient  | Un service     |
      | Description     | absent    |                |
      | Thématique      | absent    |                |

    Quand j'ajoute le résultat 123 pour l'année 2000
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2000  | 123      |             |
    Et le graphique de l'indicateur n'est pas vide
    Et le badge "À compléter" est absent
    Et le badge "Complété" est visible

    Quand j'ajoute le commentaire "plop" à la ligne 1
    Et que j'ajoute le résultat 456 pour l'année 2001
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2001  | 456      |             |
      | 2000  | 123      | plop        |
    Et le graphique de l'indicateur n'est pas vide
    Et le badge "À compléter" est absent
    Et le badge "Complété" est visible

    Quand je me reconnecte en tant que visiteur
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le tableau des résultats est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2001  | 456      |             |
      | 2000  | 123      | plop        |

  Scénario: Ajouter, éditer, et supprimer un indicateur personnalisé
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors le texte "Aucun indicateur personnalisé" est visible

    Quand je clique sur le bouton "Créer un indicateur"
    Alors le texte "Les indicateurs personnalisés" est visible

    Quand je crée l'indicateur avec les données suivantes :
      | Nom            | Unité | Description    | Thématique        |
      | Mon indicateur | %     | Ma description | Énergie et climat |
    Alors le texte "Les indicateurs personnalisés" est absent
    Et le texte "Mon indicateur" est visible
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide
    Et le badge "À compléter" est visible
    Et le badge "Complété" est absent

    Quand je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors le texte "Aucun indicateur personnalisé" est absent
    Et la page contient au moins 1 graphique vide

    Quand je clique sur le 1er graphique
    Alors la page vérifie les conditions suivantes :
      | Elément         | Condition | Valeur            |
      | Description     | contient  | Ma description    |
      | Personne pilote | contient  |                   |
      | Service pilote  | contient  |                   |
      | Thématique      | contient  | Énergie et climat |

    Quand je crée un tag "Michel Sapasse" avec le sélecteur de tag "personnes"
    Et que je crée un tag "Un service" avec le sélecteur de tag "ServicePilote"
    Alors la page vérifie les conditions suivantes :
      | Elément         | Condition | Valeur            |
      | Description     | contient  | Ma description    |
      | Personne pilote | contient  | Michel Sapasse    |
      | Service pilote  | contient  | Un service        |
      | Thématique      | contient  | Énergie et climat |

    Quand j'ajoute le résultat 123 pour l'année 2000
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2000  | 123      |             |

    Quand j'ajoute le résultat 456 pour l'année 2001
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2001  | 456      |             |
      | 2000  | 123      |             |
    Et le graphique de l'indicateur n'est pas vide
    Et le badge "À compléter" est absent
    Et le badge "Complété" est visible

    Quand je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors la page ne contient pas de graphiques vides

    Quand je clique sur le 1er graphique
    Et que je clique sur le bouton "Supprimer"
    Et que je clique sur le bouton "Supprimer" de la "modale de confirmation"
    Et que je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors le texte "Aucun indicateur personnalisé" est visible

