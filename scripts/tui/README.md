# TUI — tableau de bord de la stack locale

Dashboard terminal de la stack docker `tet` : statuts/santé des services, mémoire consommée, URL locale de chaque composant, logs navigables, start/stop/restart. Aucune installation : versionné dans le dépôt, exécuté par node nu.

## Utilisation

```shell
make tui                        # ou : pnpm tui
node scripts/dev-tui.mts --once # snapshot texte sans TUI (CI, agents, pas de TTY)
```

| Touche          | Action                                     |
| --------------- | ------------------------------------------ |
| `↑` `↓`         | naviguer                                   |
| `⇥` / `←` `→`   | section suivante / précédente              |
| `⏎`             | logs du service                            |
| `t`             | shell dans le conteneur (bash, sinon sh)   |
| `o`             | ouvrir l'URL dans le navigateur            |
| `␣` (espace)    | toggle démarré ⇄ stoppé                    |
| `d` / `s` / `r` | démarrer / stopper / relancer              |
| `Échap`         | logs : retour à la liste · liste : quitter |
| `q` / `Ctrl+C`  | quitter                                    |

Dans les logs : `↑↓` `PgUp/PgDn` scrollent et **figent** le flux, `f` ou `End` raccrochent au direct, `Début` va au début du buffer.

## Comment ça marche

Exécution directe des `.mts` par le type-stripping de Node ≥ 23.6 — pas de build, pas de JSX (non transformé par node) : le rendu passe par `htm/react` (syntaxe quasi-JSX en template literals) sur [ink 7](https://github.com/vadimdemedes/ink) (React pour le terminal).

- Liste : poll `docker compose ps -a --format json` toutes les 2 s. Sections : Apps → Infra → Apps secondaires (studio, strapi, mailpit) → One-shots (atténués).
- Mémoire : `compose stats --no-stream` sur un poll séparé de 4 s (le sampling coûte ~2 s, il ne doit jamais bloquer celui des statuts), best-effort, jointure par nom de conteneur.
- Logs : `compose logs -f` spawné par service, chunks découpés en lignes dans un ring buffer (2000 lignes), re-rendu throttlé à 100 ms.
- URLs : apps en `network_mode: host` → port résolu comme `dev-apps` (checkPorts) (env `<APP>_PORT` > `.env.local` > défaut), donc corrects depuis un worktree (ports décalés par slot). Infra → ports publiés du compose, en dur dans `stack-service/url-resolver.mts`.
- Actions : `compose start|stop|restart` agissent **en place** (aucune recréation de conteneur, donc pas de remontage de bind mounts) → pas de `guard-main`, utilisable depuis un worktree comme `make logs`/`make ps`. Bloquées sur les one-shots (`sqitch`, `seeder`, `deps`, `libs`) : les relancer ré-exécuterait migrations/seeds.
- Shell (`t`) : le TUI se démonte (écran et raw mode restaurés par ink), `compose exec` prend le terminal ; à la sortie du shell, le TUI remonte en conservant la sélection.

## Architecture

Entrée : [`../dev-tui.mts`](../dev-tui.mts) — CLI (`--once`, garde TTY), construit `DockerStack` + `UrlResolver` et les **injecte** dans l'UI. Aucun composant n'importe l'infrastructure : tout se teste avec des doublures.

| Fichier                                  | Rôle                                                                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docker-stack.mts`](./docker-stack.mts) | Adapter compose : `ps()`, `run(action, service)`, `streamLogs()`. Seul fichier qui exécute docker.                                                                                                                                                         |
| [`stack-service/`](./stack-service/)     | Domaine, une préoccupation par fichier : `status.mts` (glyphe), `service.mts` (`StackService` : tri, sections, one-shot), `url-resolver.mts` (`UrlResolver`), `memory.mts` (dégradé), `build-services.mts` (assemble modèle + URLs). `index.mts` = barrel. |
| [`line-buffer.mts`](./line-buffer.mts)   | Ring buffer de lignes (reliquat de chunk, cap mémoire). Sans dépendance.                                                                                                                                                                                   |
| [`hooks/`](./hooks/)                     | Pont React, un hook par fichier : `use-poll.mts`, `use-stats.mts`, `use-log-stream.mts`. `index.mts` = barrel.                                                                                                                                             |
| [`ui-kit.mts`](./ui-kit.mts)             | `html` (htm/react), `HelpBar`, `openUrl`.                                                                                                                                                                                                                  |
| [`service-list/`](./service-list/)       | Vue liste : `list-items.mts` (groupement par section), `service-row.mts` (ligne), `use-list-input.mts` (clavier). `index.mts` = composant `ServiceList`, remonte `onSelect`/`onShowLogs`/`onAction`, n'exécute rien.                                       |
| [`log-view.mts`](./log-view.mts)         | Vue logs. Viewport scrollable, offset `null` = suivi du flux.                                                                                                                                                                                              |
| [`app.mts`](./app.mts)                   | Racine : navigation liste ⇄ logs, actions en vol, erreurs.                                                                                                                                                                                                 |

## Contraintes à connaître

- **TS effaçable uniquement** (contrainte type-stripping) : pas d'`enum`, de `namespace`, ni de parameter properties. Les imports portent l'extension réelle `.mts` (exigence ESM de node) — d'où [`../tsconfig.json`](../tsconfig.json) (`nodenext` + `allowImportingTsExtensions` + `noEmit`).
- Importer `{ html } from 'htm/react'`, jamais `htm` nu : son default export est typé CJS et casse `tsc` sous `nodenext`.
- `--ansi always` est un flag **global** compose (avant `logs`), sinon pas de couleurs vers un pipe.
- 1 ligne de log = 1 rangée écran (`wrap="truncate-end"`) : c'est ce qui garantit des offsets de scroll exacts — ne pas remplacer par du wrap.
