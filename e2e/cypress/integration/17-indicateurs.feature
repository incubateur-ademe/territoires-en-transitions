# language: fr

Fonctionnalité: Visualiser et éditer les indicateurs

  Scénario: Visualiser une liste d'indicateurs prédéfinis
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Tous les indicateurs" de la collectivité courante
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
      | Description     | visible   |        |
      | Thématique      | absent    |        |

    Quand je crée un tag "Michel Sapasse" avec le sélecteur de tag "personnes"
    Et que je crée un tag "Un service" avec le sélecteur de tag "ServicePilote"
    Alors la page vérifie les conditions suivantes :
      | Elément         | Condition | Valeur         |
      | Personne pilote | contient  | Michel Sapasse |
      | Service pilote  | contient  | Un service     |
      | Description     | visible   |                |
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

# à réparer
@skip
  Scénario: Ajouter, éditer, et supprimer un indicateur personnalisé
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Tous les indicateurs" de la collectivité courante
    Et que je clique sur le bouton "Créer un indicateur"
    Alors le texte "Créer un indicateur personnalisé" est visible

    Quand je crée l'indicateur avec les données suivantes :
      | Nom            | Unité | Description    | Thématique        |
      | Mon indicateur | %     | Ma description | Énergie et climat |
    Alors le texte "Les indicateurs personnalisés" est absent
    Et le texte "Mon indicateur" est visible
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide
    Et le badge "À compléter" est visible
    Et le badge "Complété" est absent

    Quand je suis sur la page "Tous les indicateurs" de la collectivité courante
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

  Scénario: Appliquer des données de l'opendata à mes résultats (sans conflit)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des résultats importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "resultat" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"
    Et la source "CITEPA" est sélectionnée
    Alors le tableau des résultats est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |
    Et le bouton "Appliquer à mes résultats" est visible

    # la source "mes données" est toujours vide
    Quand je sélectionne la source "Mes données"
    Et la source "Mes données" est sélectionnée
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # applique les données aux résultats
    Quand je sélectionne la source "CITEPA"
    Et que je clique sur le bouton "Appliquer à mes résultats"
    Alors le bouton "Appliquer à mes résultats" est absent

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire                                                           |
      | 2021  | 120      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |

  Scénario: Appliquer des données de l'opendata à mes résultats (avec conflit et écrasement)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des résultats importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "resultat" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |

    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"
    Et la source "CITEPA" est sélectionnée
    Alors le tableau des résultats est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |
    Et le bouton "Appliquer à mes résultats" est visible

    # la source "mes données" est toujours vide
    Quand je sélectionne la source "Mes données"
    Et la source "Mes données" est sélectionnée
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des données utilisateur
    Quand j'ajoute le résultat 123 pour l'année 2021
    Et que j'ajoute le résultat 456 pour l'année 2022
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2022  | 456      |             |
      | 2021  | 123      |             |

    Quand je sélectionne la source "CITEPA"
    Alors le tableau des résultats est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |

    # applique les données aux résultats => ouvre le dialogue
    Quand je clique sur le bouton "Appliquer à mes résultats"
    Alors le "dialogue de résolution des conflits" est visible
    Et le dialogue de résolution des conflits contient :
      | Date | Mes résultats | Résultats CITEPA | Après validation |
      | 2021 | 123           | 120              | 123              |
      | 2020 |               | 100              | 100              |

    # choisi d'écraser les valeurs en conflit
    Quand je coche la case "Remplacer mes résultats"
    Alors le dialogue de résolution des conflits contient :
      | Date | Mes résultats | Résultats CITEPA | Après validation |
      | 2021 | 123           | 120              | 120              |
      | 2020 |               | 100              | 100              |

    Quand je clique sur le bouton "Valider" du "dialogue de résolution des conflits"
    Alors le bouton "Appliquer à mes résultats" est absent

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire                                                           |
      | 2022  | 456      |                                                                       |
      | 2021  | 120      |                                                                       |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |

  Scénario: Appliquer des données de l'opendata à mes résultats (avec conflit mais sans écrasement)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des résultats importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "resultat" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"

    # ajoute des données utilisateur
    Quand je sélectionne la source "Mes données"
    Et que j'ajoute le résultat 123 pour l'année 2021
    Et que j'ajoute le résultat 456 pour l'année 2022
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2022  | 456      |             |
      | 2021  | 123      |             |

    Quand je sélectionne la source "CITEPA"
    Alors le tableau des résultats est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |

    # applique les données aux résultats => ouvre le dialogue
    Quand je clique sur le bouton "Appliquer à mes résultats"
    Alors le "dialogue de résolution des conflits" est visible
    Et le dialogue de résolution des conflits contient :
      | Date | Mes résultats | Résultats CITEPA | Après validation |
      | 2021 | 123           | 120              | 123              |
      | 2020 |               | 100              | 100              |

    Quand je clique sur le bouton "Valider" du "dialogue de résolution des conflits"
    # le bouton reste visible puisqu'il reste des données "écrasables"
    Alors le bouton "Appliquer à mes résultats" est visible

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire                                                           |
      | 2022  | 456      |                                                                       |
      | 2021  | 123      |                                                                       |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |

  Scénario: Appliquer des données de l'opendata à mes objectifs (sans conflit)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent

    Quand je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des objectifs importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "objectif" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"
    Et la source "CITEPA" est sélectionnée
    Et le tableau des objectifs est en lecture seule et contient :
      | Année | Résultat | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |
    Et le bouton "Appliquer à mes objectifs" est visible

    # la source "mes données" est toujours vide
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # applique les données aux objectifs
    Quand je sélectionne la source "CITEPA"
    Et que je clique sur le bouton "Appliquer à mes objectifs"
    Alors le bouton "Appliquer à mes objectifs" est absent

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur contient :
      | Année | Objectif | Commentaire                                                           |
      | 2021  | 120      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |

  Scénario: Appliquer des données de l'opendata à mes objectifs (avec conflit et écrasement)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent

    Quand je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des objectifs importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "objectif" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |

    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"
    Et la source "CITEPA" est sélectionnée
    Et le tableau des objectifs est en lecture seule et contient :
      | Année | Objectif | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |
    Et le bouton "Appliquer à mes objectifs" est visible

    # la source "mes données" est toujours vide
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des données utilisateur
    Quand j'ajoute l'objectif 123 pour l'année 2021
    Et que j'ajoute l'objectif 456 pour l'année 2022
    Alors le tableau des objectifs de l'indicateur contient :
      | Année | Objectif | Commentaire |
      | 2022  | 456      |             |
      | 2021  | 123      |             |

    Quand je sélectionne la source "CITEPA"
    Alors le tableau des objectifs est en lecture seule et contient :
      | Année | Objectif | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |

    # applique les données aux objectifs => ouvre le dialogue
    Quand je clique sur le bouton "Appliquer à mes objectifs"
    Alors le "dialogue de résolution des conflits" est visible
    Et le dialogue de résolution des conflits contient :
      | Date | Mes objectifs | Objectifs CITEPA | Après validation |
      | 2021 | 123           | 120              | 123              |
      | 2020 |               | 100              | 100              |

    # choisi d'écraser les valeurs en conflit
    Quand je coche la case "Remplacer mes objectifs"
    Alors le dialogue de résolution des conflits contient :
      | Date | Mes objectifs | Objectifs CITEPA | Après validation |
      | 2021 | 123           | 120              | 120              |
      | 2020 |               | 100              | 100              |

    Quand je clique sur le bouton "Valider" du "dialogue de résolution des conflits"
    Alors le bouton "Appliquer à mes objectifs" est absent

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur contient :
      | Année | Objectif | Commentaire                                                           |
      | 2022  | 456      |                                                                       |
      | 2021  | 120      |                                                                       |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |

  Scénario: Appliquer des données de l'opendata à mes objectifs (avec conflit mais sans écrasement)
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    # pas de données importées et pas de données collectivité
    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources est absent

    Quand je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur est vide
    Et le graphique de l'indicateur est vide

    # ajoute des objectifs importés
    Quand l'indicateur "cae_18" dispose de données "citepa" de type "objectif" avec les valeurs suivantes :
      | Année | Valeur |
      | 2020  | 100    |
      | 2021  | 120    |
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le sélecteur de sources contient "Mes données, CITEPA"

    # ajoute des données utilisateur
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Et que j'ajoute l'objectif 123 pour l'année 2021
    Et que j'ajoute l'objectif 456 pour l'année 2022
    Alors le tableau des objectifs de l'indicateur contient :
      | Année | Objectif | Commentaire |
      | 2022  | 456      |             |
      | 2021  | 123      |             |

    Quand je sélectionne la source "CITEPA"
    Alors le tableau des objectifs est en lecture seule et contient :
      | Année | Objectif | Commentaire |
      | 2021  | 120      |             |
      | 2020  | 100      |             |

    # applique les données aux objectifs => ouvre le dialogue
    Quand je clique sur le bouton "Appliquer à mes objectifs"
    Alors le "dialogue de résolution des conflits" est visible
    Et le dialogue de résolution des conflits contient :
      | Date | Mes objectifs | Objectifs CITEPA | Après validation |
      | 2021 | 123           | 120              | 123              |
      | 2020 |               | 100              | 100              |

    Quand je clique sur le bouton "Valider" du "dialogue de résolution des conflits"
    # le bouton reste visible puisqu'il reste des données "écrasables"
    Alors le bouton "Appliquer à mes objectifs" est visible

    # vérifie que les données copiées sont affichées
    Quand je sélectionne la source "Mes données"
    Et que je clique sur l'onglet Objectifs
    Alors le tableau des objectifs de l'indicateur contient :
      | Année | Objectif | Commentaire                                                           |
      | 2022  | 456      |                                                                       |
      | 2021  | 123      |                                                                       |
      | 2020  | 100      | CITEPA, 2024, inventaire cadastral des émissions de GES / scope 1 & 2 |
