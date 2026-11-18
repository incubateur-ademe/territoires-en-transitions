// Ressource MCP `tet://docs/carte-du-depot` : où chercher dans le code source
// pour vérifier le fonctionnement de la plateforme. Chaque chemin entre
// accents graves qui commence par `apps/`, `packages/`, `data_layer/`, `doc/`,
// `e2e/` ou `strapi/` est vérifié par `carte-du-depot.doc.spec.ts`.

export const REPO_FULL_NAME = 'incubateur-ademe/territoires-en-transitions';

export const CARTE_DU_DEPOT_DOC = `# Carte du dépôt ${REPO_FULL_NAME}

Dépôt public GitHub, branche \`main\`. Cette carte dit **où chercher** ; elle ne décrit pas le comportement. Une affirmation sur le fonctionnement de la plateforme se vérifie dans les fichiers, puis se cite avec leur chemin.

## Vue d'ensemble

| Dossier | Contenu |
| --- | --- |
| \`apps/app\` | Application des collectivités (Next.js) : écrans, formulaires, textes d'interface |
| \`apps/backend\` | API (NestJS, tRPC) : règles appliquées, droits, accès à la base |
| \`packages/domain\` | Règles métier pures et schémas partagés entre l'app et l'API |
| \`apps/site\` | Site public (pages, statistiques, FAQ alimentée par Strapi) |
| \`apps/tools\` | Tâches planifiées et synchronisations (Crisp, Notion, Airtable) |
| \`packages/ui\` | Composants d'interface génériques, sans règle métier |
| \`data_layer/sqitch/deploy\` | Migrations SQL : tables, vues, fonctions de la base |
| \`strapi\` | Contenus éditoriaux du site (FAQ, pages, actualités) |
| \`doc/adr\` | Décisions d'architecture ; \`doc/plans\` : cadrages de fonctionnalités |
| \`e2e\` | Tests de bout en bout : parcours utilisateur décrits pas à pas |

## Trajet d'une fonctionnalité

1. **Route** : \`apps/app/app\` ne contient que les routes. Le dossier reprend l'URL, par exemple \`apps/app/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/plans\`. La page délègue à une vue.
2. **Écran** : \`apps/app/src/<domaine>/<sous-domaine>/<fonctionnalité>/\`, fichiers \`*.view.tsx\`, \`*.form.tsx\`, \`*.table.tsx\`, \`*.modal.tsx\`.
3. **Appel** : hook dans le sous-dossier \`data/\` (\`use-<verbe>-<entité>.ts\`), qui appelle une procédure tRPC \`trpc.<domaine>.<...>\`.
4. **API** : \`apps/backend/src/<domaine>/<sous-domaine>/<fonctionnalité>/\` avec un fichier par responsabilité (voir ci-dessous).
5. **Base** : \`*.table.ts\` (schéma Drizzle) ; l'historique SQL est dans \`data_layer/sqitch/deploy\`.

Les dossiers ont le même nom des deux côtés : \`apps/app/src/plans/fiches\` répond à \`apps/backend/src/plans/fiches\` et à \`packages/domain/src/plans/fiches\`.

## Lire un nom de fichier

Noms en kebab-case, **termes métier en français** (\`fiche\`, \`mesure\`, \`collectivite\`, \`referentiel\`, \`indicateur\`, \`preuve\`, \`axe\`), technique en anglais. Une fonctionnalité commence par un verbe : \`get\`, \`list\`, \`upsert\`, \`create\`, \`update\`, \`delete\`, \`add\`, \`remove\`, \`send\`, \`validate\`, \`calculate\`, \`toggle\`.

| Suffixe | Ce qu'on y lit |
| --- | --- |
| \`.rules.ts\` | Règle métier pure : **le premier fichier à lire** pour « dans quel cas… » |
| \`.service.ts\` | Enchaînement : contrôle des droits, appels, effets (e-mail, notification) |
| \`.router.ts\` | Procédure tRPC exposée ; \`authedProcedure\` = utilisateur connecté requis |
| \`.input.ts\`, \`.output.ts\` | Champs acceptés et renvoyés, contraintes de validation |
| \`.errors.ts\` | Cas d'erreur et messages renvoyés à l'utilisateur |
| \`.repository.ts\`, \`.table.ts\` | Requêtes et colonnes de la base |
| \`.email.tsx\` | Contenu d'un e-mail envoyé |
| \`.worker.ts\`, \`.queue.ts\` | Traitement en arrière-plan |
| \`.e2e-spec.ts\`, \`.spec.ts\` | Tests : comportement attendu, cas limites |

## Domaines

| Sujet | App | API | Règles partagées |
| --- | --- | --- | --- |
| Comptes, connexion, ProConnect, invitations | \`apps/app/src/users\` | \`apps/backend/src/users\` | \`packages/domain/src/users\` |
| Rôles et droits | \`apps/app/src/users/authorizations\` | \`apps/backend/src/users/authorizations\` | \`packages/domain/src/users/authorizations\` |
| Collectivités, membres, documents, personnalisation | \`apps/app/src/collectivites\` | \`apps/backend/src/collectivites\` | \`packages/domain/src/collectivites\` |
| Référentiels (CAE, ECI, TE), mesures, statuts, preuves | \`apps/app/src/referentiels\` | \`apps/backend/src/referentiels\` | \`packages/domain/src/referentiels\` |
| Calcul des scores, snapshots | \`apps/app/src/referentiels/scores\` | \`apps/backend/src/referentiels/compute-score\`, \`apps/backend/src/referentiels/snapshots\` | \`packages/domain/src/referentiels/scores\` |
| Labellisation, audit | \`apps/app/src/referentiels/labellisations\`, \`apps/app/src/referentiels/audits\` | \`apps/backend/src/referentiels/labellisations\` | \`packages/domain/src/referentiels/labellisations\` |
| Indicateurs, valeurs, sources | \`apps/app/src/indicateurs\` | \`apps/backend/src/indicateurs\` | \`packages/domain/src/indicateurs\` |
| Trajectoires (SNBC) | \`apps/app/src/indicateurs/trajectoires\` | \`apps/backend/src/indicateurs/trajectoires\` | \`packages/domain/src/indicateurs/trajectoires\` |
| Plans d'action, axes | \`apps/app/src/plans/plans\` | \`apps/backend/src/plans/plans\`, \`apps/backend/src/plans/axes\` | \`packages/domain/src/plans/plans\` |
| Fiches action (pilotes, budget, étapes, partage, export) | \`apps/app/src/plans/fiches\` | \`apps/backend/src/plans/fiches\` | \`packages/domain/src/plans/fiches\` |
| Import d'un plan par IA | \`apps/app/src/plans/plans/import-plan\` | \`apps/backend/src/plans/ai-plan-import\` | |
| Démarche PCAET (dépôt, avis, instruction) | \`apps/app/src/demarches/pcaet\` | \`apps/backend/src/demarches/pcaet\` | \`packages/domain/src/demarches/pcaet\` |
| Tableaux de bord | \`apps/app/src/tableaux-de-bord\` | \`apps/backend/src/collectivites\`, \`apps/backend/src/metrics\` | |
| Notifications, e-mails | | \`apps/backend/src/utils/notifications\`, \`apps/backend/src/utils/email\` | \`packages/domain/src/utils/notifications\` |
| Listes de référence (thématiques, services, régions) | \`apps/app/src/shared\` | \`apps/backend/src/shared\` | \`packages/domain/src/shared\` |

## Questions fréquentes : où regarder

- **« Qui a le droit de… »** : \`packages/domain/src/users/authorizations/permission.models.ts\` (droits de chaque rôle) et \`packages/domain/src/users/authorizations/permission-operation.enum.schema.ts\` (liste des opérations). Le contrôle se lit dans le \`.service.ts\` de la fonctionnalité (\`isAllowed\`). Les fiches ont leurs règles propres : \`apps/backend/src/plans/fiches/fiche-action-permissions.service.ts\`.
- **« Que veut dire ce libellé / où est ce bouton »** : chercher le texte exact dans \`apps/app/src/labels\` (un fichier \`*.labels.ts\` par domaine), puis chercher la clé trouvée dans \`apps/app/src\` pour arriver à l'écran.
- **« Quelle page correspond à cette URL »** : \`apps/app/app\`, puis \`apps/app/src/app/paths.ts\` pour les constructeurs d'URL.
- **« Pourquoi ce message d'erreur »** : chercher le message dans les \`*.errors.ts\` de \`apps/backend/src\`.
- **« Dans quel cas l'action est bloquée / possible »** : \`*.rules.ts\` du domaine, d'abord dans \`packages/domain/src\`.
- **« Quel e-mail part, et quand »** : fichiers \`*.email.tsx\` et \`apps/backend/src/utils/notifications\`.
- **« Comment est calculé… »** : \`apps/backend/src/referentiels/compute-score\` pour les scores, \`*.rules.ts\` sinon.
- **« Qu'est-ce qui tourne la nuit »** : \`apps/tools/src/cron\`.
- **« Pourquoi ce choix technique »** : \`doc/adr\`.

## Méthode

1. Repérer le domaine dans le tableau, puis le dossier de la fonctionnalité (son nom commence par un verbe).
2. Chercher le **terme métier français** ou le texte exact vu à l'écran, dans ce dossier d'abord.
3. Lire la règle (\`.rules.ts\`), puis le service, puis le test s'il reste un doute.
4. Répondre en citant les fichiers lus. Si le code n'a pas pu être lu, le dire : la carte seule ne prouve rien.

À ne pas prendre pour modèle : les fichiers préfixés \`DEPRECATED_\` ou \`[deprecated]\`.
`;
