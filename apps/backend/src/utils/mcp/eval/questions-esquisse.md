# Jeu de questions d'évaluation : esquisses et statistiques

Questions que les PS posent réellement pendant une formalisation, avec la façon attendue d'y répondre. Sert à la recette avec Baptiste (itération 0) et à détecter une régression quand les règles métier ou les requêtes nommées changent.

Pour chaque question : l'outil attendu, les règles à respecter, et la réponse de référence à remplir lors de la recette (valeur + date). Une réponse du modèle est acceptée si le chiffre correspond à ± 2 % et si la requête citée respecte les règles.

| # | Question | Outil attendu | Règles à respecter | Réponse de référence (date) |
| --- | --- | --- | --- | --- |
| 1 | Combien de collectivités sont activées, par catégorie ? | `run_named_query collectivites_activees_par_categorie` | Activation ≠ activité ; `ct_actives` | à remplir |
| 2 | Combien de collectivités et d'utilisateurs actifs sur les 90 derniers jours ? | `run_named_query collectivites_actives_periode(jours=90)` | `activite_semaine`, pas PostHog ; agents seulement | à remplir |
| 3 | Combien de plans pilotables actifs sur 52 semaines, et dans combien de collectivités ? | `run_named_query plans_actifs_52_semaines` | Dernier mois seulement, `statut = 'actif'`, ne pas cumuler les mois | à remplir |
| 4 | Répartition des niveaux de labellisation actuels CAE et ECI | `run_named_query labellisation_actuelle_par_referentiel` | Dernière labellisation, pas `max(etoiles)` ; CAE et ECI séparés | à remplir |
| 5 | Plans actifs sur 52 semaines par région | `run_sql_query` sur `pap_statut_5_fiches_modifiees_52_semaines` joint à `ct_actives` (région) | Dernier mois, `statut = 'actif'` | à remplir |
| 6 | Taux d'activation des communes de moins de 5 000 habitants | `run_sql_query` : `ct_actives` (catégorie Communes) rapporté à `prod` collectivités communes par population | Exclure `type = 'test'` ; préciser la source de la population | à remplir |
| 7 | Part des EPCI activés depuis le 1er janvier ayant saisi au moins une valeur d'indicateur | `run_sql_query` : `ct_actives.date_activation` × `prod.indicateur_valeur` (`resultat IS NOT NULL`, `metadonnee_id IS NULL`) | Valeurs saisies par les utilisateurs seulement | à remplir |
| 8 | Nombre de fiches action par statut, hors sous-actions et fiches supprimées | `run_sql_query` sur `prod` fiche_action | `parent_id IS NULL`, `coalesce(deleted,false) = false`, collectivités test exclues | à remplir |
| 9 | Collectivités engagées (COT ou labellisation) sans plan pilotable | `run_sql_query` : `cot ∪ labellisation` moins `pap_date_passage` | Définition « engagée » du glossaire | à remplir |
| 10 | Complétion moyenne du référentiel CAE par type de collectivité | `run_sql_query` sur `score_snapshot` | Formule `(fait+programme+pas_fait)/potentiel*100`, dernier snapshot par collectivité | à remplir |
| 11 | Pages les plus consultées par les communes de moins de 5 000 habitants ce trimestre | `run_hogql_query` (agrégat par `$pathname`, 90 jours) puis `run_sql_query` pour filtrer par population | `{internal_emails}` dans l'agrégat ; `$current_url` de prod ; `LIMIT` | à remplir |
| 12 | Combien d'utilisateurs ont utilisé l'export de plan ce mois-ci ? | `run_sql_query` sur `feature_all` (feature export, mois courant) | Une ligne par (mois, collectivité, e-mail) : compter des e-mails distincts, ne pas les lister | à remplir |
| 13 | Évolution mensuelle du nombre de plans sur 12 mois | `run_sql_query` sur `evolution_nombre_plans` ou `plan_distrib` | Tables cumulées : ne pas sommer les mois | à remplir |
| 14 | Quels retours utilisateurs sur l'import de plan ces 3 derniers mois ? | `run_sql_query` sur `retours_utilisateurs_*` (si accordé au rôle) ; sinon dire que la source n'est pas disponible | Pas de texte nominatif ; thèmes et volumes seulement | à remplir |
| 15 | Rédige l'esquisse « améliorer l'activation des communes de moins de 5 000 habitants » | Prompt `esquisse-shape-up` + questions 1, 2, 6, 11 | Toutes les sections du modèle, un seul appétit, chaque chiffre dans Recherche, inconnues listées | relecture par un PS |

## Déroulé de la recette

1. Lancer chaque question depuis Claude.ai avec le connecteur branché sur staging (ou prod une fois le rôle en place).
2. Comparer au dashboard de Baptiste quand la question y existe ; sinon faire valider la requête par Baptiste et noter la valeur et la date.
3. Noter les écarts dans ce fichier et corriger en priorité les ressources (`resources/*.doc.ts`) ou le catalogue (`named-queries.catalog.ts`), pas le code.
