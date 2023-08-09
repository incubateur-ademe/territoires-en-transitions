# language: fr

Fonctionnalité: Visualiser et éditer les indicateurs

  Scénario: Visualiser une liste d'indicateurs prédéfinis
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Indicateurs CAE" de la collectivité courante
    Alors la page contient au moins 4 graphiques vides

  Scénario: Editer un indicateur prédéfini
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je visite l'indicateur "cae/cae_18" de la collectivité courante
    Alors le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide
    Et le badge "À compléter" est visible
    Et le badge "Complété" est absent

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

  Scénario: Ajouter et éditer un indicateur personnalisé
    Etant donné une collectivité nommée "Le Bois Joli"
    Et un utilisateur avec les droits en "edition"

    Quand je suis connecté avec les droits en "edition"
    Et que je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors le texte "Aucun indicateur personnalisé" est visible

    Quand je clique sur le bouton "Créer un indicateur"
    Alors le texte "Créer un indicateur personnalisé" est visible

    Quand je crée l'indicateur avec les données suivantes :
      | Nom            | Unité | Description    |
      | Mon indicateur | %     | Ma description |
    Alors le texte "Créer un indicateur personnalisé" est absent
    Et le texte "Mon indicateur" est visible
    Et le tableau des résultats de l'indicateur est vide
    Et le graphique de l'indicateur est vide
    Et le badge "À compléter" est visible
    Et le badge "Complété" est absent

    Quand je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors le texte "Aucun indicateur personnalisé" est absent
    Et la page contient au moins 1 graphique vide

    Quand je clique sur le 1er graphique
    Et que j'ajoute le résultat 123 pour l'année 2000
    Et que j'ajoute le résultat 456 pour l'année 2001
    Alors le tableau des résultats de l'indicateur contient :
      | Année | Résultat | Commentaire |
      | 2001  | 456      |             |
      | 2000  | 123      |             |
    Et le graphique de l'indicateur n'est pas vide
    Et le badge "À compléter" est absent
    Et le badge "Complété" est visible

    Quand je suis sur la page "Indicateurs personnalisés" de la collectivité courante
    Alors la page ne contient pas de graphiques vides
