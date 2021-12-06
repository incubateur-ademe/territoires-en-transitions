export PGPASSWORD=your-super-secret-and-long-postgres-password
psql --host localhost --port 50001 --dbname postgres --user postgres --file "./postgres/fakes/11-insert_fake_user.sql"
# psql --host localhost --port 50001 --dbname postgres --user postgres --file "./postgres/fakes/12-insert_fake_referentiel.sql"
psql --host localhost --port 50001 --dbname postgres --user postgres --file "./postgres/fakes/13-insert_fake_statut.sql"
psql --host localhost --port 50001 --dbname postgres --user postgres --file "./postgres/fakes/14-insert_fake_action_commentaire.sql"
