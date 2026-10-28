# Flow de design : de la maquette à l'implémentation

Une page pour tout le flow. Le détail est ailleurs, et chaque fichier ne
contient que ce qui le concerne (voir « Où vit quoi »).

## Le flow

| Étape                   | Qui                                                 | Outil                                                 | Sortie                                                                                       |
| ----------------------- | --------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 0. Design system à jour | auteur d'un changement de `@tet/ui`, ou automatique | Claude Code, `/ds-publish`                            | le design system « Territoires en Transitions » de Claude Design aligné sur `main`           |
| 1. Maquette             | designer                                            | Claude Design (canevas)                               | une maquette conforme aux règles, besoins non couverts notés « Proposition »                 |
| 2. Prototype            | designer                                            | Claude Code, `/proto-import <slug> <lien du canevas>` | la page construite (artifact), la PR draft `proto/<slug>`, le compte rendu des écarts        |
| 3. Passation            | designer, PO                                        | Claude Code, `/proto-handoff <slug>`                  | `handoff.md` (périmètre, correspondance avec l'app, données, questions), PR prête pour revue |
| 4. Propositions         | design, devs du design system                       | PR sur `packages/ui`                                  | les composants retenus dans `@tet/ui`, puis dans Claude Design (étape 0)                     |
| 5. Implémentation       | dev                                                 | Claude Code dans `apps/app`                           | la PR d'implémentation, à partir de `handoff.md`                                             |

`/proto-import` lance lui-même `/ds-publish`. Après un merge sur `@tet/ui`, le
résumé du workflow `design-system-export` rappelle de le lancer.

## Les règles

Huit règles de conformité, **R1 à R8**, dans
[`packages/ui/scripts/design-system-export/rules.md`](../packages/ui/scripts/design-system-export/rules.md).
C'est la seule source : Claude Design les reçoit dans le README du design
system (insérées par l'export), les skills et la doc y renvoient par leur
numéro.

## Les trois verrous

1. **Avant le prototype** : la maquette suit R1 à R6. Claude Design le
   rappelle, sans garantie : c'est une consigne.
2. **Avant la passation** : aucun écart « à trancher » (R7, R8).
   `/proto-import` remplace chaque écart par l'option conforme la plus proche
   et le liste ; `/proto-handoff` refuse tant qu'il en reste.
3. **Avant la revue** : aucune décision de design ouverte. `/proto-handoff`
   laisse la PR en draft tant que le designer ou le PO n'a pas tranché.

## Rôles

- **Designer** : maquette, tranche les écarts dans le canevas, lance
  `/proto-import` puis `/proto-handoff`.
- **PO** : valide le périmètre et tranche les décisions de design de
  `handoff.md`.
- **Devs du design system** : décident des propositions, les ajoutent à
  `@tet/ui`, lancent `/ds-publish` après le merge.
- **Dev** : implémente dans `apps/app` à partir de `handoff.md` ; règle les
  questions techniques.

## Avant de commencer

- La PR de fondation (`apps/prototypes`, skills, export) est mergée sur
  `main`.
- Le propriétaire du design system l'a partagé avec l'équipe depuis son menu
  Partager : en lecture pour designers et devs, en édition pour qui lance
  `/ds-publish`. Chaque artifact de prototype se partage de la même façon.
- Une session Claude Code ouverte sur le repo : son hook de démarrage installe
  tout (voir [`apps/prototypes/README.md`](../apps/prototypes/README.md)).
  Après une mise à jour des skills, ouvrir une nouvelle session.

## Où vit quoi

| Quoi                                              | Où                                                           |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Le flow (cette page)                              | `doc/design-flow.md`                                         |
| Les règles R1 à R8                                | `packages/ui/scripts/design-system-export/rules.md`          |
| La charte du design system (couleurs, ton, logos) | `packages/ui/scripts/design-system-export/brand-book.md`     |
| Les procédures de Claude                          | `.claude/skills/proto-import`, `proto-handoff`, `ds-publish` |
| Écrire le code d'un prototype                     | `apps/prototypes/CLAUDE.md`                                  |
| Installer, lancer, déployer                       | `apps/prototypes/README.md`                                  |

Changer une règle : modifier `rules.md`, puis `/ds-publish` après le merge.
Changer une étape : modifier cette page et le skill concerné.
