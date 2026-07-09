# syntax=docker/dockerfile:1
# Image de dev de l'app Next.js « app » : tout le socle (node, pnpm, dotenvx, user UID/GID,
# config Nx) vient de l'image commune tet-node-dev (.docker/apps/base.Dockerfile), construite
# par make up. Ne reste ici que le lancement propre à l'app.
FROM tet-node-dev

CMD ["dotenvx", "run", "--env-keys-file=.env.keys", "--ignore=MISSING_ENV_FILE", \
     "-f", "apps/app/.env.local", "-f", "apps/app/.env", "-f", ".env.local", "-f", ".env", \
     "--", "pnpm", "exec", "nx", "dev", "app"]
