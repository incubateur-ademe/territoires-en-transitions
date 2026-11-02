# Passation design — <titre>

> Maquette Claude Design : <lien du canevas> · à implémenter dans `apps/app`.
> La maquette est une référence visuelle : partir du code existant listé
> ci-dessous.

## Périmètre

<Ce que l'implémentation touche dans l'app, à valider par le PO : la route
cible, le composant remplacé ou ajouté, et chaque endroit qui l'utilise.>

- Routes : `<apps/app/app/…/page.tsx>`
- Composants touchés : `<chemin>` (utilisé par `<chemin>`, `<chemin>`)

## Ce que fait la page

<3 à 6 puces : ce que l'utilisateur voit et peut faire.>

## Correspondance avec l'app

Route cible : `<apps/app/app/…/page.tsx>` (existante | à créer).

| Élément de la maquette | Dans l'app | Statut    | Note                    |
| ---------------------- | ---------- | --------- | ----------------------- |
| <bloc ou interaction>  | `<chemin>` | existe    | <réutiliser tel quel>   |
| <…>                    | `<chemin>` | à adapter | <le changement attendu> |
| <…>                    | —          | à créer   | <ce qui manque>         |

## Propositions de design system

À trancher avec le design avant l'implémentation ; une proposition retenue
s'ajoute à `packages/ui`, puis repasse dans Claude Design par `/ds-publish`.

| Proposition (note du canevas) | Besoin   | Équivalent existant  |
| ----------------------------- | -------- | -------------------- |
| <« Proposition : … »>         | <besoin> | <aucun, ou `chemin`> |

## Données

| Donnée affichée | Servie par                                 | Champ     | Statut                          |
| --------------- | ------------------------------------------ | --------- | ------------------------------- |
| <donnée>        | `<procédure tRPC>` (`<chemin du service>`) | `<champ>` | servie / à calculer / manquante |

## Questions techniques

Pour le dev, à régler pendant l'implémentation.

1. <question> — <pourquoi la maquette ne la tranche pas>.
