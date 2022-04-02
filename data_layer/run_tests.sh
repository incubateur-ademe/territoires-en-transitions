export PGPASSWORD=your-super-secret-and-long-postgres-password

pg_prove --host localhost --dbname postgres --username postgres --port 50001 postgres/tests/**/*.sql
