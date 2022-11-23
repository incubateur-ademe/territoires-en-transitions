#!/bin/sh

supabase gen types typescript --db-url "postgresql://postgres:$POSTGRES_PASSWORD@host.docker.internal:$POSTGRES_PORT/postgres" > ./lib/database.types.ts
