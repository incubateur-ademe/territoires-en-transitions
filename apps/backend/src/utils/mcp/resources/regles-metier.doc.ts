// Règles métier et glossaire servis au modèle comme ressource MCP
// `tet://docs/regles-metier`. Assemblés depuis le prompt de l'assistant de
// statistiques et les fichiers posthog-db-query/{pieges,glossaire}.md du
// dashboard de Baptiste (BaptisteTCS/dashboard_tet).

export const REGLES_METIER_DOC = `# Règles métier pour interroger la base analytique

Ces règles viennent de l'assistant de statistiques du dashboard interne (Baptiste) ; elles s'appliquent à \`run_sql_query\` (PostgreSQL) et, pour la partie événements, à \`run_hogql_query\` (PostHog).

## Les deux schémas

- **\`public\`** : statistiques pré-agrégées, alimentées chaque jour depuis la production (données à J-1). Collectivités de test et utilisateurs internes **déjà exclus**. À privilégier pour l'usage, la fréquentation, les métriques, les OKR, l'activation, le scoring des plans, la labellisation agrégée. Voir \`tet://docs/base-analytique\`.
- **\`prod\`** : miroir des données applicatives (collectivités, plans, fiches action, indicateurs, référentiels, labellisation, droits). Pour le détail d'une collectivité, d'un plan, d'une fiche, d'un indicateur. Exclure systématiquement les collectivités de test : \`collectivite.type != 'test'\`.
- Les deux schémas se croisent par \`collectivite_id\`.
- Attention aux homonymes : \`public.collectivite\`, \`public.cot\`, \`public.labellisation\`, \`public.score_snapshot\` sont des exports ADEME dont les colonnes et le sens diffèrent des tables \`prod.*\` du même nom.
- Les noms réels des tables du schéma \`prod\` peuvent porter le préfixe de leur schéma d'origine (\`prod.public_fiche_action\` plutôt que \`prod.fiche_action\`) : vérifier avec \`list_tables\` avant la première requête, puis \`describe_table\` pour les colonnes.

## Règles de décision

- Chaque chiffre annoncé vient d'un résultat d'outil ; sinon, dire qu'on ne sait pas.
- Préfixer toutes les tables de leur schéma. Jointures explicites (\`JOIN ... ON\`). Une seule instruction par appel.
- Un aperçu est limité à 20 lignes : agréger ou filtrer plutôt que lister.
- Si un résultat vaut 0, est vide ou paraît incohérent, vérifier la requête (types, casse, filtres de date, nom de table) avant de conclure.
- Annoncer le défaut appliqué quand un terme est ambigu (voir le glossaire).

## Règles métier (schéma \`prod\`)

- Les plans d'action sont dans \`axe\` (un plan est un axe dont \`id = plan\`) ; le lien avec les fiches action passe par \`fiche_action_axe\`.
- « FA », « action » désignent une \`fiche_action\` ; « mesure » ou « mesure du référentiel » désigne une \`action\` du référentiel (\`action_definition\`, \`action_statut\`), à ne pas confondre.
- Une sous-action est une \`fiche_action\` dont \`parent_id\` est non nul : **toujours exclue** des statistiques sur les fiches (\`parent_id IS NULL\`), sauf demande explicite. Exclure aussi les fiches supprimées : \`coalesce(deleted, false) = false\`.
- Une fiche liée à une fiche : \`fiche_action_lien\` ; une fiche liée à une mesure : \`fiche_action_action\`.
- Budget d'investissement d'une fiche : \`fiche_action_budget\` avec \`type = 'investissement'\`.
- Un indicateur est personnalisé quand \`indicateur_definition.collectivite_id\` est non nul. On désigne souvent un indicateur par son \`identifiant_referentiel\` (\`cae_43.a\`, \`covoit_lieu\`).
- Les valeurs d'indicateurs sont dans \`indicateur_valeur\` (\`indicateur_id\` → \`indicateur_definition.id\`). « Valeurs renseignées » = au moins une valeur dans \`resultat\`. Toute statistique sur une série de valeurs se groupe par \`metadonnee_id\` : \`NULL\` = saisie utilisateur, non nul = open data.
- Les droits des utilisateurs sont dans \`private_utilisateur_droit\` (\`niveau_acces\`), ne garder que \`active = true\` sauf si on demande l'historique.
- Les conseillers sont les utilisateurs ayant eu au moins une fois \`private_collectivite_membre.fonction = 'conseiller'\`.
- Le nombre d'étoiles est dans \`labellisation\` ; le niveau actuel est la dernière valeur par collectivité et par référentiel (\`obtenue_le\` le plus récent), pas \`max(etoiles)\`.
- Une collectivité avec un COT est présente dans \`cot\` ; sans COT, elle n'y est pas.
- Collectivités « engagées » (programme TETE) : \`SELECT DISTINCT collectivite_id FROM prod.cot UNION SELECT DISTINCT collectivite_id FROM prod.labellisation\`.
- Complétion du référentiel (%) : \`(point_fait + point_programme + point_pas_fait) / point_potentiel * 100\` dans \`score_snapshot\`.
- Si le référentiel n'est pas précisé, donner les résultats séparément pour CAE et ECI.

## Pièges et filtres obligatoires

Texte repris de \`posthog-db-query/pieges.md\` du dashboard. Les sections sur la traduction HogQL ne concernent que \`run_hogql_query\` ; la base analytique s'interroge en PostgreSQL.


## 1. Filtres obligatoires

**Collectivités de test**
- Sur les tables \`prod.*\`, exclus-les toujours : \`JOIN prod.collectivite c ON c.id = x.collectivite_id WHERE c.type != 'test'\`.
- Les tables de stats (\`activite_semaine\`, \`ct_actives\`, \`pap_*\`, etc.) les excluent déjà : inutile de re-filtrer.

**Utilisateurs internes**
- Sur \`prod.*\` (PostgreSQL, \`run_sql_query\`), exclus-les toujours : \`lower(email) NOT IN (SELECT lower(email) FROM public.internal_users WHERE email IS NOT NULL)\`.
- Sur \`events\` (PostHog, \`run_hogql_query\`), la table \`internal_users\` n'existe pas : pour un agrégat, insère le marqueur \`{internal_emails}\` dans la requête (\`AND coalesce(person.properties.email, '') NOT IN ({internal_emails})\`), remplacé côté serveur par la liste des adresses internes ; pour une liste de lignes avec une colonne \`email\`, le filtrage est fait après coup et la colonne est retirée du résultat.
- Les tables de stats les excluent déjà.

**Sous-actions**
- Toute stat sur les fiches action exclut les sous-actions (\`prod.fiche_action.parent_id IS NULL\`), sauf demande explicite.
- Exclus aussi les fiches supprimées : \`coalesce(deleted, false) = false\`.

**Droits actifs**
- Sur \`prod.private_utilisateur_droit\`, ne garde que \`active = true\`, sauf si on demande l'historique.

**Événements PostHog**
- Filtre toujours une plage \`timestamp\`, un \`event\` précis et l'app de production : \`properties.$current_url ILIKE '%app.territoiresentransitions.fr%'\`.

## 2. HogQL n'est pas du PostgreSQL

HogQL suit le dialecte ClickHouse. La documentation OLAP d'origine et les anciennes requêtes sont en Postgres : traduis-les.

| PostgreSQL | HogQL |
|---|---|
| \`TO_DATE(x, 'YYYY-MM-DD')\`, \`x::date\` | \`toDate(x)\` |
| \`x::int\`, \`CAST(x AS INTEGER)\` sur du texte douteux | \`toInt64OrNull(x)\` |
| \`x::text\` | \`toString(x)\` |
| \`CURRENT_DATE\`, \`NOW()\` | \`today()\`, \`now()\` |
| \`INTERVAL '3 months'\` | \`INTERVAL 3 MONTH\` |
| \`date_trunc('month', d)\` | \`toStartOfMonth(d)\` |
| \`date_trunc('week', d)\` | \`toStartOfWeek(d)\` (semaine commençant le dimanche ; \`toMonday(d)\` pour le lundi) |
| \`DISTINCT ON (...)\` | \`argMax(valeur, date)\` avec \`GROUP BY\` |
| \`UNION\` | \`UNION DISTINCT\` (ou \`UNION ALL\` puis \`DISTINCT\`) |
| \`string_agg\` | \`arrayStringConcat(groupArray(x), ', ')\` |

- **\`count(DISTINCT x)\`** fonctionne. **\`uniq(x)\`** est approximatif : ne l'utilise pas pour un chiffre exact.
- **Divisions** : \`a / b\` renvoie un flottant. Utilise \`round(x, 1)\` pour l'affichage et protège-toi des divisions par zéro avec \`if(b = 0, NULL, a / b)\`.
- **Comparaisons avec \`NULL\`** : \`x != 'test'\` est faux quand \`x\` est NULL. Si la colonne peut être nulle, écris \`coalesce(x, '') != 'test'\`.
- **\`LEFT JOIN\`** : une ligne sans correspondance prend la valeur par défaut du type (chaîne vide, \`0\`), pas \`NULL\`. Pour détecter l'absence de correspondance, teste \`colonne != ''\` (ou \`= 0\`), pas \`IS NULL\`.

## 3. Types à convertir

| Colonne | Type réel | À faire |
|---|---|---|
| \`activite_semaine.semaine\` | texte \`YYYY-MM-DD\` | \`toDate(semaine)\` |
| \`activite_semaine.collectivite_id\`, \`user_actif_12_mois.collectivite_id\` | flottant | \`toInt64(collectivite_id)\` avant de joindre |
| \`user_actifs_ct_mois.mois\`, \`note_plan_historique.mois\`, \`statut_fiche_*.mois\`, \`nb_fap_*.mois\`, \`passage_pap_region.mois\` | texte | \`toDate(mois)\` |
| \`url_posthog.timestamp\` | texte | \`parseDateTimeBestEffort(timestamp)\` |
| \`prod.fiche_action.parent_id\`, \`prod.axe.parent\`, \`prod.indicateur_definition.collectivite_id\`, \`prod.indicateur_valeur.metadonnee_id\` | flottant (nullable) | Teste \`IS NULL\` / \`IS NOT NULL\` ; \`toInt64\` pour joindre |
| \`prod.auth_users.id\`, \`prod.private_utilisateur_droit.user_id\` | texte | Jointure directe texte contre texte |
| \`events.properties.collectivite_id\`, \`url_posthog.collectivite_id\`, \`posthog_next_path.collectivite_id\` | texte | \`toInt64OrNull(...)\` |
| Tous les emails | texte, casse variable | \`lower(trim(email))\` des deux côtés |

Une jointure qui renvoie 0 ligne vient presque toujours d'un problème de type ou de casse, pas d'une absence de données.

## 4. Choisir la bonne table

- **Usage, utilisateurs actifs, collectivités actives** : \`activite_semaine\`, **jamais** les pages vues PostHog. PostHog est sous-estimé à cause des bloqueurs de publicité, alors que \`activite_semaine\` détecte aussi les modifications côté app.
- **\`activite_semaine\` vs \`user_actifs_ct_mois\`** : la première exclut BE, conseillers et @ademe.fr ; la seconde les inclut. Le défaut est \`activite_semaine\`.
- **Activation et activité** sont deux notions distinctes. \`ct_actives\` donne l'activation (date du premier membre), pas l'activité récente.
- **Tables homonymes** : \`collectivite\`, \`labellisation\`, \`cot\` et \`score_snapshot\` existent en version stats et en version \`prod.*\`, avec des colonnes et un sens différents. Les versions de stats sont des exports ADEME.
- **Labellisation actuelle** : prends la dernière valeur par collectivité et par référentiel. En PostgreSQL : \`SELECT DISTINCT ON (collectivite_id, referentiel) collectivite_id, referentiel, etoiles FROM labellisation ORDER BY collectivite_id, referentiel, obtenue_le DESC\` ; en HogQL : \`argMax(etoiles, obtenue_le)\`. \`max(etoiles)\` donne le meilleur niveau jamais atteint, qui diffère si une collectivité a perdu une étoile.
- **Tables mensuelles de statut** (\`pap_statut_*\`, \`statut_fiche_*\`, \`user_actif_12_mois\`) : pour la valeur actuelle, filtre sur \`mois = (SELECT max(mois) FROM ...)\`. Ne cumule pas les mois entre eux.
- **Tables cumulées** (\`fa_distrib\`, \`evolution_ind_od\`, \`evolution_labellisation\`) : chaque mois contient déjà le total. Ne somme pas les mois.
- **Tables \`*_backup\` et \`*_historique_backup\`** : historisation de l'état passé, pas l'état actuel.
- **Ancien scoring sur 5** (\`pap_note*\`) et **nouveau sur 10** (\`note_plan_historique\`, \`note_fiche_historique\`) : précise toujours lequel tu utilises. Le défaut est le nouveau.
- **Tables obsolètes ou à ignorer** : voir la fin de la partie stats dans \`tet://docs/base-analytique\`.

## 5. Casse et noms de tables

- \`Score_mesures\` (S majuscule), \`bizdev_A_F_contact\` et la colonne \`sub-feature\` de \`feature\` doivent être entourées de backticks ou de guillemets selon ce qu'accepte HogQL.
- \`crisp_temps_resoluton\` s'écrit sans le second « i ».
- Le nom réel d'une table dans le warehouse peut porter un préfixe de source : vérifie-le avec \`list_tables\`.

## 6. Limites de l'API PostHog

- **Sans \`LIMIT\`**, une requête renvoie 100 lignes. Le maximum est 50 000 lignes par requête.
- **Pour plus de lignes**, agrège davantage ou découpe la période par mois (une requête par mois, puis concaténation).
- **Les requêtes sur \`events\` sans filtre de date** sont lentes et peuvent expirer. Commence par une période courte (30 à 90 jours).
- **\`person.properties.email\` est nul** pour les visiteurs anonymes. Un filtre \`NOT IN (internal_users)\` élimine aussi ces lignes : c'est voulu pour les stats par utilisateur, mais il faut le savoir pour un comptage de pages vues brutes.
- **Données à J-1** : les tables de stats sont recalculées une fois par jour. Les événements PostHog sont quasi temps réel.

## 7. Garde-fous de réponse

- Lecture seule : uniquement des \`SELECT\`.
- N'annonce aucun chiffre qui ne vient pas d'un résultat de requête.
- Si un résultat vaut 0, est vide ou paraît incohérent, vérifie la requête (types, casse, filtres de date, nom de table) avant de conclure.


## Glossaire

Texte repris de \`posthog-db-query/glossaire.md\` du dashboard.


Quand un terme est ambigu et que la question ne précise rien, applique le **défaut** indiqué et annonce-le dans la réponse.

## Acteurs

| Terme | Signification | Où le trouver |
|---|---|---|
| **CT** | Collectivité | \`prod.collectivite\`, \`ct_actives\` |
| **Agent** / utilisateur d'une collectivité | Personne qui travaille pour une collectivité (hors BE, conseillers et internes) | \`activite_semaine\` (déjà filtrée) |
| **BE** | Bureau d'études, partenaire qui travaille dans l'app pour une collectivité | Inclus dans \`user_actifs_ct_mois\`, exclu de \`activite_semaine\` |
| **Conseiller** | Utilisateur qui a eu au moins une fois \`prod.private_collectivite_membre.fonction = 'conseiller'\` | \`prod.private_collectivite_membre\` |
| **Utilisateur interne** | Membre de l'équipe TET | \`internal_users.email\`, toujours à exclure |
| **Niveau d'accès** / droits | Droit d'un utilisateur sur une collectivité (lecture, édition, admin...) | \`prod.private_utilisateur_droit.niveau_acces\` |

**« Utilisateurs »** sans précision désigne par défaut les agents, via \`activite_semaine\`. Utilise \`user_actifs_ct_mois\` seulement si on parle de « tous les utilisateurs » ou de « fréquentation globale ».

## Activité et engagement

| Terme | Signification | Où le trouver |
|---|---|---|
| **Utilisateur actif** | A visité l'app (ou y a modifié quelque chose) dans la période | \`activite_semaine\` (DISTINCT \`email\`) |
| **Collectivité active** | Au moins un utilisateur actif dans la période | \`activite_semaine\` (DISTINCT \`collectivite_id\`) |
| **Actif à 12 mois** | Actif au moins une fois sur le mois et les 11 précédents | \`user_actif_12_mois\` |
| **Collectivité activée** / activation | A reçu son premier membre (hors BE, partenaires et conseillers) | \`ct_actives.date_activation\` |
| **Collectivité engagée** | A un COT ou une labellisation | \`prod.cot\` UNION \`prod.labellisation\` (DISTINCT \`collectivite_id\`) |
| **COT** | Contrat d'Objectif Territorial | \`prod.cot\` (présence dans la table = COT) |
| **Pipeline** | Étape commerciale de la collectivité | \`pipeline\`, \`airtable_sync.pipeline\` |

**« Actif »** pour un plan désigne par défaut la définition sur 52 semaines (North Star publique). Utilise 13 semaines si on parle d'OKR interne ou de « North Star interne ».

## Plans et actions

| Terme | Signification | Où le trouver |
|---|---|---|
| **Plan** / plan d'action | Axe racine | \`prod.axe\` où \`id = plan\` |
| **Axe**, sous-axe | Niveau de structuration d'un plan | \`prod.axe\` (\`parent\`, \`plan\`) |
| **FA**, **fiche action**, **action** | Fiche action d'un plan | \`prod.fiche_action\` |
| **Sous-action** | Fiche action dont \`parent_id\` est non nul | \`prod.fiche_action.parent_id\`, **exclue par défaut** de toutes les stats sur les fiches |
| **FAP** / fiche action pilotable | Fiche avec au moins un titre, un statut et un pilote (personne ou service / direction) | \`fa_distrib\`, \`nb_fap_*\`, \`statut_fiche_*\` |
| **Action active** (site public) | Action pilotable active | \`fa_distrib.action_pilotable_actives\` |
| **PAP** / plan d'action pilotable | Plan avec au moins 5 fiches pilotables | \`pap_date_passage\` |
| **Collectivité PAP** | Possède au moins un PAP | \`SELECT DISTINCT collectivite_id FROM pap_date_passage\` |
| **PAP actif 13 / 52 semaines** | PAP dont au moins 5 fiches ont été modifiées sur la période | \`pap_statut_5_fiches_modifiees_13_semaines\` / \`_52_semaines\`, \`statut = 'actif'\` |
| **North Star** | Métrique principale de succès : nombre de PAP actifs | Publique : 52 semaines ; interne : 13 semaines |
| **Note** / score d'un plan | Nouveau scoring sur 10 | \`note_plan_historique\`, \`note_fiche_historique\` |
| **Ancienne note** | Ancien scoring sur 5 | \`pap_note\`, \`pap_note_snapshot\` |
| **Fiche liée** | Fiche liée à une autre fiche | \`prod.fiche_action_lien\` |
| **Fiche liée à une mesure** | Fiche rattachée à une mesure du référentiel | \`prod.fiche_action_action\` |
| **Budget d'investissement** | Budget de type investissement | \`prod.fiche_action_budget.type = 'investissement'\` |
| **Pilote**, référent | Responsable d'une fiche ou d'un plan | \`prod.fiche_action_pilote\`, \`prod.plan_pilote\`, \`*_referent\` |

## Référentiels et labellisation

| Terme | Signification | Où le trouver |
|---|---|---|
| **Référentiel** | Grille d'évaluation : \`cae\` ou \`eci\` | Colonne \`referentiel\` / \`referentiel_id\` |
| **CAE** | Climat-Air-Énergie | \`referentiel = 'cae'\` |
| **ECI** | Économie circulaire | \`referentiel = 'eci'\` |
| **Mesure**, mesure du référentiel | Une \`action\` du référentiel (à ne pas confondre avec une fiche action) | \`prod.action_definition\`, \`prod.action_statut\` |
| **Étoiles**, niveau de labellisation | Niveau obtenu par référentiel | \`labellisation.etoiles\` (dernière valeur par référentiel) |
| **Collectivité labellisée** | Au moins une ligne dans \`labellisation\` avec \`etoiles\` ≥ 1 | \`labellisation\` |
| **Complétion du référentiel** | \`(point_fait + point_programme + point_pas_fait) / point_potentiel * 100\` (%) | \`prod.score_snapshot\` |
| **Audit** | Audit de labellisation | \`prod.labellisation_audit\`, \`audit\` (export) |

Si le référentiel n'est pas précisé, donne les résultats **séparément pour CAE et pour ECI**.

## Indicateurs

| Terme | Signification | Où le trouver |
|---|---|---|
| **Indicateur** | Définition d'un indicateur, désigné par son \`identifiant_referentiel\` (ex. \`cae_43.a\`, \`covoit_lieu\`) | \`prod.indicateur_definition\` |
| **Indicateur personnalisé** | Indicateur créé par une collectivité | \`prod.indicateur_definition.collectivite_id IS NOT NULL\` |
| **Valeur d'indicateur** | Valeur à une date | \`prod.indicateur_valeur\` (\`indicateur_id\` → \`prod.indicateur_definition.id\`) |
| **Valeurs renseignées** | Au moins une valeur dans \`resultat\` | \`prod.indicateur_valeur.resultat IS NOT NULL\` |
| **OD** / open data | Valeur venant d'une source open data | \`prod.indicateur_valeur.metadonnee_id IS NOT NULL\` |
| **Valeur utilisateur** | Valeur saisie par la collectivité | \`prod.indicateur_valeur.metadonnee_id IS NULL\` |

Les stats sur une série de valeurs d'indicateurs se groupent **toujours par \`metadonnee_id\`**, pour séparer les valeurs saisies par les utilisateurs des valeurs open data.

## Événements PostHog

| Terme | Signification | Où le trouver |
|---|---|---|
| **Page vue**, visite | Affichage d'une page | \`events\`, \`event = '$pageview'\` |
| **URL**, page | Adresse ou chemin de la page | \`properties.$current_url\`, \`properties.$pathname\` |
| **Collectivité de l'événement** | Collectivité consultée | \`properties.collectivite_id\` (texte) |
| **Email de l'utilisateur** | Personne identifiée | \`person.properties.email\` |
| **App de production** | Uniquement l'app réelle | \`properties.$current_url ILIKE '%app.territoiresentransitions.fr%'\` |
| **Session** | Session de navigation | \`$session_id\` (propriété ou colonne selon le contexte) |
| **Parcours**, page suivante | Enchaînement des pages | \`posthog_next_path\` (table déjà calculée) ou \`events\` |
| **Usage d'une fonctionnalité** | Événement dédié ou page spécifique | \`feature\` (table), sinon \`events\` filtrés sur l'événement ou le chemin |

Pour découvrir les noms d'événements disponibles, agrège \`events\` par \`event\` sur une fenêtre courte (30 jours) avec un \`LIMIT\`, avant de filtrer sur un événement précis.
`;
