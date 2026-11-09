# Flow de design : de la maquette à l'implémentation

## Le flow

| Étape                   | Qui                   | Outil                          | Sortie                                                                                 |
| ----------------------- | --------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| 0. Design system à jour | devs du design system | Claude Code, `/ds-publish`     | le design system « Territoires en Transitions » de Claude Design aligné sur `main`     |
| 1. Maquette             | designer              | Claude Design (canevas)        | une maquette composée avec les composants `@tet/ui`, besoins non couverts notés        |
| 2. Passation            | designer, PO          | Claude Code, `/design-handoff` | une issue GitHub en langage produit : la page, l'écran concerné, propositions, données |
| 3. Implémentation       | dev                   | Claude Code dans `apps/app`    | la correspondance avec le code existant, puis la PR, à partir de l'issue               |

Lancer `/ds-publish` après chaque merge qui touche `@tet/ui` ou
`@tet/design-tokens`, et avant de commencer une maquette. Une proposition
retenue à la passation s'ajoute à `@tet/ui` par une PR, puis repasse dans
Claude Design par `/ds-publish`.

## Les règles

Huit règles de conformité, **R1 à R8**, dans
[`packages/ui/scripts/design-system-export/rules.md`](../packages/ui/scripts/design-system-export/rules.md).
C'est la seule source : Claude Design les reçoit dans le README du design
system, insérées par l'export.

La passation attend qu'il ne reste aucun écart « à trancher » (R7, R8) ni
aucune décision de design ouverte : le designer les règle dans le canevas,
puis relance `/design-handoff`.

## Avant de commencer

Le design system de Claude Design se partage depuis son menu Partager : en
lecture pour les designers et les devs, en édition pour qui lance
`/ds-publish`.
