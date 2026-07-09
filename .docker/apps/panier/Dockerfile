# syntax=docker/dockerfile:1
# Image de dev de l'app Next.js « panier » : tout le socle (node, pnpm, dotenvx, user UID/GID,
# config Nx) vient de l'image commune tet-node-dev (.docker/apps/base.Dockerfile), construite
# par make up. Ne reste ici que le lancement propre à l'app.
FROM tet-node-dev

CMD ["dotenvx", "run", "--env-keys-file=.env.keys", "--ignore=MISSING_ENV_FILE", \
     "-f", "apps/panier/.env.local", "-f", "apps/panier/.env", \
     "-f", "apps/auth/.env.local", "-f", "apps/auth/.env", "-f", ".env.local", "-f", ".env", \
     "--", "pnpm", "exec", "nx", "dev", "panier"]
