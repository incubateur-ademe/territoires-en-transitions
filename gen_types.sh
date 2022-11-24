#!/bin/sh

# génère les types TS à partir de la base de données
supabase gen types typescript --db-url postgresql://postgres:${POSTGRES_PASSWORD}@host.docker.internal:${POSTGRES_PORT}/postgres > ./api_tests/lib/database.types.ts
cp ./api_tests/lib/database.types.ts ./app.territoiresentransitions.react/src/types/database.types.ts
