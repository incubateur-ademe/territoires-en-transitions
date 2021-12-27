export PGPASSWORD=your-super-secret-and-long-postgres-password

SQL_DIR="./postgres/definitions"
for file in $SQL_DIR/*.sql; do
    psql --host localhost --port 50001 --dbname postgres --user postgres --file "${file}"
done
