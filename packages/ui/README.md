# package `ui`

Composants d'interface réutilisables entre les différentes apps.

## Shadcn

### Ajouter un nouveau composant

Depuis `packages/ui`, run

```sh
pnpm dlx shadcn@latest add nom-du-composant
```

## Chromatic

Pour publier les stories sur [Chromatic](https://www.chromatic.com/library?appId=6940722131b5fabfa5f50e01), run

```sh
nx chromatic ui
```

Requiert `CHROMATIC_PROJECT_TOKEN` en variable d'environnement.
