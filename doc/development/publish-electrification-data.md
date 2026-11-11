# Publier le catalogue et les lauréats Électrification

La synchronisation lit les deux sources Grist, vérifie les données puis publie
une version dans le stockage privé TeT. Elle se lance uniquement à la main via
[GitHub Actions](../../.github/workflows/sync-electrification-data.yml).
Elle ne déclenche aucun import de plan ni appel IA. Les imports utilisent les
versions publiées, sans interroger Grist.

## Configurer les environnements GitHub

La PR C doit être déployée sur la cible. Le workflow doit être présent sur la
branche par défaut pour être proposé dans l'onglet Actions. Utiliser une
révision compatible avec le backend déployé.

Renseigner ces secrets séparément dans les environnements `staging`, `preprod` et `prod` :

| Secret                            | Usage                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `DB_URL`                          | Connexion PostgreSQL de la cible, pour les validations et métadonnées du stockage. |
| `API_URL`                         | URL Supabase de la même cible.                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`       | Accès au stockage privé de cette cible.                                            |
| `SUPABASE_DATABASE_SSL_ROOT_CERT` | CA PEM, uniquement si la base exige un certificat propre.                          |
| `GRIST_API_KEY`                   | Clé d'un compte ayant accès en lecture aux deux documents Grist.                   |

Ajouter aussi la variable d'environnement GitHub
`ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID` : identifiant du document de
lauréats autorisé pour cette cible, obligatoire pour `kind=laureats`.
L'adresse du catalogue vient des références d'indicateurs publiées dans la
base cible ; aucun identifiant de document catalogue n'est configuré en code.

Le build réutilise la préparation pnpm et le secret Bryntum habituels du dépôt.
Les droits de lancement et les protections de l'environnement GitHub contrôlent
la publication. Aucune session utilisateur TeT n'est nécessaire dans le runner.
Le workflow lit les secrets de l'environnement GitHub choisi. Les secrets Koyeb
ne lui sont pas transmis ; aucune configuration Grist du backend déployé n'est
nécessaire pour cette synchronisation.
Les endpoints d'administration conservent leur contrôle `SUPER_ADMIN`.
Ne pas copier les identifiants prod dans les secrets staging ou préprod.
Le dépôt possède aussi un secret `SUPABASE_SERVICE_ROLE_KEY` : le définir dans
chaque environnement pour utiliser la clé de cette cible, sans hériter de celle du dépôt.

## Préparer les sources

Le document Grist désigné par `lienSource` doit exposer les
six tables `V1_3_Axes`, `V1_3_Sous_axes`, `V1_3_Actions`, `V1_3_Sous_actions`,
`V1_3_Indicateurs` et `V1_3_Ressources`. Dans `V1_3_Axes`, `Code_signe`
fournit les engagements (dont `E01+E02` sur un même axe) et `Parametre_signe`
leur formulation. Ces colonnes existent déjà ; la synchronisation lit Grist
sans modifier ses tables. Les titres des actions non chiffrées viennent du
paramètre signé, ou du titre d'axe si ce paramètre contient un blanc à remplir.
Les identités des sous-actions restent stables après renommage, déplacement
et réordonnancement. Un changement de document ou de table nécessite de
vérifier cette continuité.

### Publier les références d’indicateurs

1. Appliquer la migration `indicateur/references-externes` avant de déployer C.
2. Compléter et faire valider l’onglet "Références externes" du Sheets configuré
   par `INDICATEUR_DEFINITIONS_SHEET_ID`. Le WIP n’est ni lu ni publié.
3. Utiliser les boutons existants de vérification puis de publication des
   indicateurs vers la cible voulue. Incrémenter la version dans "Versions"
   pour une publication en production, comme pour les définitions.
4. Lancer ensuite la synchronisation du catalogue Grist sur **la même cible**.

| Colonne | Rôle |
| --- | --- |
| `identifiantReferentiel` | Identifiant figurant dans "Indicateur definitions". Vide : référence publiée en attente, sans rattachement TeT. |
| `source` | `catalogue-electrification` pour les indicateurs Grist ; `engagements-electrification` pour les cibles de convention. |
| `codeExterne` | Code exact d'indicateur Grist, ou code d'engagement suivi de sa clé de cible, par exemple `E07.total`. |
| `lienSource` | URL du document source. Pour Grist, les différentes pages d'un même document sont acceptées. |

Ces quatre en-têtes sont obligatoires, même dans un onglet vide. L'onglet
contient six colonnes : les trois champs du mapping en A:C, `observation`
en D, `lienSource` en E et `lienDefinitionTeT` en F. Seuls `observation`
et `lienDefinitionTeT` restent documentaires.
Plusieurs références peuvent désigner le même indicateur TeT. Un couple
source/code répété ou un identifiant absent des définitions bloque la
publication entière, sans mise à jour partielle. Retirer un lien de la feuille
le retire des références des définitions importées ; les définitions hors
de l’import restent intactes. Les lignes sans identifiant TeT sont remplacées
par l'ensemble des lignes en attente du nouvel onglet. Une feuille illisible
ne supprime aucun lien.

`lienSource` est publié même quand l'identifiant TeT est vide. La synchronisation
résout le document à partir des liens publiés pour `catalogue-electrification`
et `engagements-electrification` : tous doivent désigner le même document Grist
HTTPS. Un lien manquant ou invalide, ou plusieurs documents pour une source,
fait échouer la publication des références. Un désaccord entre les deux
sources bloque la synchronisation du catalogue. Aucun repli vers un ancien
document n'est prévu. Sans aucune référence, la synchronisation est bloquée.

Pour changer de document, corriger tous les `lienSource` concernés, republier
les indicateurs, puis vérifier et publier le catalogue via le workflow manuel.
Vérifier la stabilité des codes et identités des sous-actions dans l'aperçu.
La source résolue figure dans le catalogue et le résumé du workflow ; elle
participe à l'identité de la version. Un échec laisse le catalogue actif intact.
Les imports en cours continuent avec la version admise.

La publication des indicateurs conserve les références dans la même transaction
et sous la même version que les définitions. La synchronisation Grist ne lit
pas le Sheets de travail : elle récupère les références déjà publiées dans la
base cible, ainsi que l’unité et la périodicité TeT. Elle ne convertit aucune
unité ni fréquence. Sans référence publiée, le code est `pending`, même s’il
était renseigné dans un ancien catalogue ; son unité et sa périodicité
restent `null`. Les colonnes `Unite` et `Frequence` de Grist ne sont pas lues
pour construire les définitions TeT. Les recensements annuels doivent
ainsi avoir une définition annuelle publiée ; aucune exception n’est en code.

Les rapprochements préremplis dans l’onglet restent à valider par le métier
avant publication. Ajouter les correspondances des 11 cibles dans ce même
onglet, sous la source `engagements-electrification` :

- `E01.principale`, `E02.principale`, `E04.principale`, `E05.principale`,
  `E06.principale`, `E08.principale`, `E09.principale`, `E10.principale`,
  `E11.principale` ;
- `E07.total` et `E07.rapides`.

E03 et E12 créent des actions sans cible chiffrée ; aucune référence
d'indicateur n'est attendue pour ces engagements. Les clés correspondent aux
champs du canevas supporté. Ne pas déduire un indicateur depuis son axe : un
axe peut porter plusieurs engagements et plusieurs indicateurs.

Les deux sources sont lues dans une même requête en base. Les unités et
périodicités des cibles viennent également des définitions TeT publiées ; une
cible validée doit être annuelle. Sans correspondance publiée, la cible reste
`pending` avec des métadonnées nulles ; seuls les imports qui l'utilisent sont
bloqués. Une référence supprimée ne réutilise pas l'ancien mapping du catalogue.
Un code d'engagement inconnu, dupliqué ou manquant dans Grist, ou une référence
de cible inconnue, bloque la synchronisation sans remplacer la version active.

Pour les lauréats, le lecteur utilise les trois colonnes existantes de
`Territoires`, dans le document configuré par
`ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID`. Leurs libellés sont reliés aux
IDs techniques par l'API de métadonnées Grist.

| Colonne | Utilisation |
| --- | --- |
| "Code territoire" | Référence unique du lauréat dans la publication. |
| "Identifiant public" | Code INSEE pour une commune, SIREN pour un EPCI. |
| "Nature du périmètre" | Type attendu : "Commune", "EPCI" ou "Groupement de collectivités". |

Seule une correspondance unique de même type dans TeT est retenue. Les
identifiants vides, inconnus ou ambigus et les groupements sans porteur
explicite sont exclus et comptés. Aucun porteur n'est déduit du nom, du périmètre
ou d'une publication précédente. Grist n'est pas modifié. Une source invalide,
un code dupliqué, une colonne absente/ambiguë ou aucun lauréat résolu bloque
la publication. Les contacts et colonnes privées ne sont pas publiés ni logués.

La liste publiée remplace intégralement la liste active et n'expire pas
automatiquement. Vérifier le nombre retenu et les exclusions avant de publier :
les anciens porteurs provisoires absents de Grist ne sont pas conservés.
Pour couvrir tous les groupements, la source doit désigner leurs porteurs
avec un identifiant public ; voir les [dépendances dans l'ADR 0024](../adr/0024-publier-donnees-electrification-sans-deploiement.md#couverture-des-lauréats--décision-du-13-novembre-2026).

Pour tester sur une collectivité non lauréate, activer le mode super-admin dans
TeT. Le flag de création doit cibler cette collectivité et les données publiées
rester valides. Aucun ajout de collectivité de démonstration à Grist ou à la
liste publiée n'est nécessaire. Garder le mode actif jusqu'à la fin de l'import.

## Lancer une synchronisation

Dans GitHub, ouvrir **Actions > Synchronisation Grist Électrification > Run workflow** :

1. Choisir une branche compatible avec le backend déployé.
2. Choisir la cible `staging`, `preprod` ou `prod` et le jeu `catalogue` ou `laureats`.
3. Choisir `verify` pour contrôler sans écriture, ou `publish` pour contrôler
   puis publier. Chaque lancement est manuel ; aucun cron ni push ne lance la synchronisation.

Le résultat indique le jeu, sa version, la révision Grist, le nombre d'entrées
et d'exclusions, ainsi que le statut `verified`, `published` ou `unchanged`. Les deux jeux sont indépendants :
faire un lancement pour chacun. Une panne sur les lauréats ne retire pas le catalogue.
Une modification de Grist pendant une lecture bloque cette exécution. Un second
lancement relit la source : `verify` ne réserve pas les données pour un futur `publish`.

La version est calculée automatiquement à partir du contenu validé (SHA-256),
correspondances TeT comprises. Une modification de la seule révision Grist ou
des colonnes privées ne crée pas de version. Aucun numéro ni date n'est à saisir.
Un contenu actif inchangé renvoie `unchanged` : aucune nouvelle version,
activation ou réécriture des métadonnées. Une version administrative déjà active
est également conservée si son contenu est identique.

Pour les lauréats, `validFrom` est la date de première publication dans TeT,
avec l'heure UTC ; ce n'est pas la date officielle de sélection du lauréat.
La liste reste active jusqu'à remplacement. Un retry après échec d'activation
ou un retour à un contenu déjà publié conserve sa première date.

Les métadonnées conservent l'opérateur GitHub, le lien du run et la révision
source de la publication effective. Les runs sont sérialisés par environnement,
sans annuler celui en cours. Aucun fichier contenant l'annuaire n'est publié
comme artifact GitHub.

En cas de refus :

- `SOURCE_NOT_CONFIGURED` : publier les `lienSource` des références externes pour
  le catalogue, ou renseigner `ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID` pour les lauréats.
- `SOURCE_UNAVAILABLE` : vérifier les droits Grist, le secret et l'accès réseau.
- `SOURCE_CHANGED` : relancer après la fin des modifications dans Grist.
- `INVALID_SOURCE` : vérifier les liens Grist, tables, colonnes et rattachements
  attendus. Les liens des deux espaces du catalogue doivent désigner le même document.
- `INVALID_DATA` : vérifier les identités et correspondances avec TeT ; utiliser
  la préparation administrative ci-dessous pour obtenir les erreurs localisées.
- `VERSION_ALREADY_EXISTS` : le contenu stocké sous cette identité est incohérent ;
  inspecter la version via la CLI admin avant de relancer, sans écraser son objet.
- `STORAGE_ERROR` : contrôler les secrets Supabase de la cible et sa disponibilité.

## Administration et restauration par CLI

- La PR C de publication (`feat/electrification-data-publication`), basée sur
  la PR B d'import, est déployée dans le backend cible. Il expose
  `plans.plans.electrificationData` et dispose de son stockage Supabase privé.
  La PR B seule conserve ses données embarquées et n'expose pas cette API.
- L'opérateur est connecté à cet environnement avec un utilisateur
  `SUPER_ADMIN`. Le backend vérifie ce rôle en base et exige un token de
  session utilisateur. Les clés API, tokens avec permissions limitées et
  tokens service role ne sont pas acceptés, même s'ils appartiennent à un
  super-admin. Un rôle actif dans une collectivité ne suffit pas.
- Le dépôt et ses dépendances sont disponibles, avec la version de Node
  déclarée dans le [package.json](../../package.json).

Depuis la racine du dépôt :

```sh
pnpm nx build backend
electrification_cli="apps/backend/dist/plans/plans/electrification/publish-electrification-data/run-publish-electrification-data.js"
node "$electrification_cli" --help
```

Préparer un fichier temporaire contenant uniquement l'access token de la
session utilisateur de l'environnement cible, avec des droits `600`. Ce
token expire avec la session. Ne pas le placer dans une commande, dans Git
ou dans un fichier de données. Supprimer le fichier de session après usage.

Les exemples utilisent ces variables locales, à renseigner :

```sh
electrification_backend="https://adresse-du-backend"
electrification_token_file="/chemin/prive/session-access-token"
```

L'adresse est l'origine du backend, sans `/trpc` ni `/api`. HTTPS est exigé,
sauf pour `localhost`, `127.0.0.1` ou `[::1]`. La commande ne suit pas les
redirections et n'affiche pas le token. Le fichier de sortie d'un export doit
être inexistant.

## Examiner un fichier préparé

La CLI administrative conserve la saisie explicite de version et de date pour
les fichiers relus, corrections et restaurations. Elle peut préparer un fichier
sans le publier, pour inspecter
les erreurs et comparer les changements. Pour préparer les lauréats, le backend
doit disposer de `GRIST_API_KEY` et de `ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID`.
Pour une synchronisation via GitHub, ces paramètres sont nécessaires uniquement
dans l'environnement du workflow.

Sur Koyeb, `cd-backend.yml` configure le backend normal et le backend de test à
partir de la variable GitHub `ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID` de
l'environnement cible. Lorsqu'elle est renseignée, le déploiement associe aussi
la variable `GRIST_API_KEY` au secret Koyeb de même nom, à créer au préalable.
L'identifiant du document n'a pas à être copié dans un secret Koyeb.
Un identifiant mal formé bloque la mise à jour du service. Sans identifiant,
ces deux variables sont retirées du service et les préparations administratives
des lauréats restent indisponibles ; les imports utilisent toujours les données
déjà publiées. Ce déploiement ne synchronise ni ne publie de données.

La synchronisation manuelle utilise séparément la clé `GRIST_API_KEY` configurée
dans GitHub. La même variable GitHub désigne le document des lauréats dans les
deux parcours. Pour Coolify, la configuration du backend reste gérée par Terraform.

```sh
node "$electrification_cli" prepare \
  --backend-url "$electrification_backend" \
  --token-file "$electrification_token_file" \
  --kind catalogue --version <nouvelle-version> \
  --file /tmp/catalogue-electrification.json

node "$electrification_cli" prepare \
  --backend-url "$electrification_backend" \
  --token-file "$electrification_token_file" \
  --kind laureats --version <nouvelle-version> --valid-from 2026-11-12 \
  --file /tmp/laureats-electrification.json
```

Le fichier préparé peut ensuite être vérifié et publié tel quel. Cette publication
ne relit pas Grist et conserve exactement le contenu relu par l'administrateur.

## Corriger les correspondances TeT ou publier un fichier préparé

Pour les indicateurs des fiches, corriger les références dans Sheets puis
publier les définitions et synchroniser Grist. Un changement de ces liens
dans un export administratif est remplacé par la prochaine synchronisation.
L'export reste adapté aux variantes de recette et restaurations.

Exporter le catalogue actif :

```sh
node "$electrification_cli" export \
  --backend-url "$electrification_backend" \
  --token-file "$electrification_token_file" \
  --kind catalogue --file /tmp/catalogue-electrification.json
```

Modifier les données et attribuer une nouvelle valeur à `version`. Conserver
les codes stables : une correction de libellé ou de parent ne doit pas les
recalculer. Les correspondances non validées restent `pending`.

Vérifier le fichier dans l'environnement cible, puis le publier :

```sh
node "$electrification_cli" verify \
  --backend-url "$electrification_backend" \
  --token-file "$electrification_token_file" \
  --kind catalogue --file /tmp/catalogue-electrification.json

node "$electrification_cli" publish \
  --backend-url "$electrification_backend" \
  --token-file "$electrification_token_file" \
  --kind catalogue --file /tmp/catalogue-electrification.json
```

`verify` ne publie rien. Les erreurs sont retournées avec leur emplacement
dans le fichier et un message. `publish` vérifie de nouveau les données et
active la version uniquement après leur enregistrement. Une version existante
avec un contenu différent est refusée. Après un timeout, exporter la version
active pour connaître le résultat avant de réessayer.

Pour les lauréats, utiliser les mêmes commandes avec `--kind laureats`.
Conserver une source identifiable et des références lauréat/collectivité
uniques. `validUntil: null` signifie que la liste n'expire pas automatiquement.
La publication d'une liste ne modifie pas le feature flag de création.

## Source faisant autorité pour chaque donnée

| Donnée | Source de maintenance |
| --- | --- |
| Axes, sous-axes, engagements et rattachements | Tables Grist du catalogue. |
| Titres et descriptions des actions/sous-actions, ordre, liens vers les indicateurs et ressources | Tables Grist du catalogue. |
| Définition TeT d'un indicateur : identifiant, titre, unité, périodicité, formule | Onglet "Indicateur definitions", après publication dans la cible. |
| Document Grist du catalogue | `lienSource` de "Références externes", après publication dans la cible. |
| Document Grist des lauréats | Variable `ELECTRIFICATION_LAUREATS_GRIST_DOCUMENT_ID` de la cible. |
| Correspondance entre un code externe et un indicateur TeT | Trois colonnes de "Références externes" : `source`, `codeExterne`, `identifiantReferentiel`. |
| Validation et compléments TeT des actions absents de Grist : objectifs, ressources humaines, structures, partenaires, dates, statut | Catalogue publié, via l'administration existante. La synchronisation conserve ces champs ; les champs fournis par Grist sont toujours remplacés depuis Grist. |
| Lauréats et correspondances collectivité | Annuaire Grist ; compatibilité du contrat de lecture à confirmer, comme indiqué plus haut. |
| Valeurs, sélections et champs renseignés par la collectivité | Document importé, selon les règles de priorité de l'import. |
| Structure, libellés et placeholders du document accepté | Contrat du canevas officiel dans le code. Ces libellés ne nomment pas les axes du plan. |
| Étapes du pipeline, identifiants de provenance, connexions et stockage | Configuration technique dans le code. |

Les observations et liens `lienDefinitionTeT` sont des aides à la revue.
`lienSource` détermine le document lu à la prochaine synchronisation.
Les libellés, unités et périodicités se consultent dans les sources liées ;
ils ne sont pas recopiés dans cet onglet. Les versions stockées et les références
en base sont des publications des sources, sans synchronisation inverse.
Un export administratif corrigé ne remplace pas la source de maintenance :
la synchronisation suivante reprend Grist et les définitions TeT pour leurs
champs respectifs. Seuls les compléments TeT explicitement listés ci-dessus
sont conservés depuis le catalogue actif.

## Configuration dans le code

Les [paramètres backend](../../apps/backend/src/plans/plans/electrification/config/)
regroupent les noms des tables Grist et des espaces de références, les noms
de stockage et le contrat de lecture du canevas. Les
[contrats partagés](../../packages/domain/src/plans/plans/electrification/config/)
et la [configuration du formulaire](../../apps/app/src/plans/plans/import-plan/electrification/config/)
restent dans leur couche. Les données métier courantes viennent des versions
publiées ; elles ne sont pas recopiées dans ces dossiers.

## Première publication dans un environnement

Le workflow construit le catalogue et ses engagements à partir de Grist.
Les correspondances TeT des cibles et des indicateurs viennent des références
Sheets publiées dans la cible, dès la première publication. Aucun mapping
d'engagement, catalogue complet ni liste de lauréats n'est embarqué dans C.

Vérifier les références TeT et le périmètre de la liste dans l'environnement
cible. Les correspondances en attente ne deviennent pas validées par la
publication. Les lauréats viennent exclusivement de l'annuaire ; la démo
`5460` nécessite une variante préprod publiée explicitement.

1. Fermer temporairement `is-electrification-plan-creation-enabled`. Les
   imports Électrification déjà admis doivent pouvoir terminer avec les
   anciens workers. Dans le suivi existant des jobs, attendre qu'il ne reste
   aucun import Électrification en attente, en cours ou programmé pour un
   retry. Ne pas relancer manuellement un import échoué pendant cette bascule.
2. Sauvegarder le contenu exact et la version des catalogues nécessaires aux
   jobs existants avant de remplacer le backend. Si C est déjà déployée,
   utiliser `export --version <version>` ; ses versions stockées sont conservées.
   Pour une bascule depuis B, extraire `electrificationConfig` du domaine compilé
   du commit effectivement déployé, avant la bascule. Grist actuel et les fixtures
   de C ne permettent pas de reconstruire une ancienne version. Ne pas poursuivre
   si un catalogue nécessaire manque. Les jobs en échec et leur historique sont
   conservés ; ils n'empêchent pas le déploiement quand aucun retry n'est programmé.
3. Appliquer la migration `indicateur/references-externes`, puis déployer la PR C,
   avec toutes les API et tous les workers compatibles.
   L'API de publication n'existe pas dans le backend de B :
   la publication intervient après ce déploiement.
4. Avec les commandes précédentes, vérifier puis publier d'abord les contenus
   exacts des anciennes versions de catalogue nécessaires aux reprises.
   Publier les définitions et références Sheets dans cette cible. Lancer
   ensuite le workflow pour le catalogue souhaité, puis pour la
   liste courante des lauréats. Chaque publication active sa version : le
   catalogue souhaité doit donc être publié en dernier parmi les catalogues.
   Exporter les jeux actifs, contrôler que leurs versions sont celles attendues
   et les vérifier ; contrôler par
   `export --version <version>` la disponibilité des catalogues des anciens
   jobs. Ne pas réétiqueter les jobs pour leur attribuer un autre catalogue.
5. Rouvrir le flag pour le périmètre de recette ou de production prévu. Les
   jobs échoués peuvent être repris une fois leur catalogue publié, sous
   réserve des autres contrôles de reprise.

En l'absence de version publiée, le parcours Électrification est indisponible ;
aucun fallback ne masque cet état. Les imports génériques et PCAET ne dépendent
pas de ces publications et continuent pendant cette bascule. Aucune mise en
pause de leur queue n'est nécessaire pour publier ces données.

## Revenir à une version antérieure

Exporter la version voulue avec `export --version <version>`, puis republier
ce fichier inchangé. Cela réactive cette version sans supprimer les suivantes.
Le catalogue des nouveaux imports change ; les jobs déjà admis gardent leur
version d'origine. Les plans créés ne sont pas modifiés.

La même règle vaut pour une correction : publier un catalogue corrigé ne
change pas celui d'un job existant. Pour utiliser la correction, lancer un
nouvel import ; une reprise conserve toujours la version d'origine.

Une réactivation de la liste des lauréats change l'éligibilité courante, y
compris pour les reprises d'import. Vérifier cet effet avant la publication.

## Limites

Les sources sont lues uniquement lors d'une préparation explicite, jamais
pendant un import de plan. Aucune synchronisation automatique ne publie les
modifications de Grist. Les engagements viennent des axes Grist ; les
définitions d'indicateurs et leurs références externes sont
publiées ensemble par le mécanisme Sheets existant. Modifier un schéma ou une règle d'import nécessite toujours
une évolution du code. La publication ne remplace pas la validation métier
ni la qualification des documents importés.

La décision et les contraintes de conservation des versions sont décrites
dans l'[ADR 0024](../adr/0024-publier-donnees-electrification-sans-deploiement.md).
