# Passation — <titre du prototype>

> Prototype `apps/prototypes/app/<slug>/` · à implémenter dans `apps/app`.
> Le prototype est une référence visuelle : partir du code existant listé
> ci-dessous, pas d'une copie du prototype.

## Liens

- Maquette Claude Design : <lien du canevas>
- Prototype publié (artifact) : <lien de l'artifact>
- Pull request du prototype : <lien>
- En local : `pnpm exec nx dev prototypes` → `http://localhost:3002/<slug>`

## Périmètre

<Ce que l'implémentation touche dans l'app, à valider par le PO : la route
cible, le composant remplacé ou ajouté, et chaque endroit qui l'utilise.>

- Routes : `<apps/app/app/…/page.tsx>`
- Composants touchés : `<chemin>` (utilisé par `<chemin>`, `<chemin>`)

## Ce que fait la page

<3 à 6 puces : ce que l'utilisateur voit et peut faire.>

## Correspondance avec l'app

Route cible : `<apps/app/app/…/page.tsx>` (existante | à créer).

| Élément du prototype  | Dans l'app | Statut    | Note                    |
| --------------------- | ---------- | --------- | ----------------------- |
| <bloc ou interaction> | `<chemin>` | existe    | <réutiliser tel quel>   |
| <…>                   | `<chemin>` | à adapter | <le changement attendu> |
| <…>                   | —          | à créer   | <ce qui manque>         |

## Propositions de design system

À trancher avec le design avant l'implémentation ; une proposition retenue
s'ajoute à `packages/ui`, puis repasse dans le design system de Claude Design.

| Proposition     | Besoin   | Équivalent existant  |
| --------------- | -------- | -------------------- |
| `<proposals/…>` | <besoin> | <aucun, ou `chemin`> |

## Données

| Donnée affichée (fixture) | Servie par                                 | Champ     | Statut                          |
| ------------------------- | ------------------------------------------ | --------- | ------------------------------- |
| `<Type.champ>`            | `<procédure tRPC>` (`<chemin du service>`) | `<champ>` | servie / à calculer / manquante |

## À trancher par le design

Bloque la passation : la pull request reste en draft tant que cette section
n'est pas vide.

1. <décision> — <pourquoi le prototype ne la tranche pas>.

## Questions techniques

Pour le dev, à régler pendant l'implémentation.

1. <question> — <pourquoi le prototype ne la tranche pas>.
