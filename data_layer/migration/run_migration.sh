# OLD PG parameters 
OLD_PGPASSWORD=FILL ME 
OLD_HOST=sandboxterr-1069.postgresql.dbs.scalingo.com
OLD_DBNAME=sandboxterr_1069
OLD_USER=sandboxterr_1069
OLD_PORT=34365

# UPCOMING PG parameters
UPCOMING_PGPASSWORD=your-super-secret-and-long-postgres-password
UPCOMING_HOST=localhost
UPCOMING_DBNAME=postgres
UPCOMING_USER=postgres
UPCOMING_PORT=50001

declare -a OLD_TABLES=(
'utilisateur'
'utilisateurdroits'
'actioncustom'
'actionmeta' 
'actionstatus'
'ademeutilisateur'
'epci'
'ficheaction'
'ficheactioncategorie'
'indicateurobjectif'
'indicateurpersonnalise'
'indicateurpersonnaliseobjectif'
'indicateurpersonnaliseresultat'
'indicateurpersonnalisevalue'
'indicateurreferentielcommentaire'
'indicateurresultat'
'indicateurvalue'
'mesurecustom'
'planaction'
)

# [Old DB] Copy old content into CSV files
#------------------------------------------
export PGPASSWORD=$OLD_PGPASSWORD
for table in ${OLD_TABLES[@]}; do
  echo "Copy old ${table} to csv from old db.";
  psql --host $OLD_HOST  --port $OLD_PORT --dbname $OLD_DBNAME --user $OLD_USER -c "\copy ${table} to './csv/${table}.csv' delimiter ',' csv header;"
done 

# [Upcoming DB] Create old schema and import old content from CSV 
# ----------------------------------------------------------------
export PGPASSWORD=$UPCOMING_PGPASSWORD

echo "Create all old tables in 'public schema' upcoming db"
psql --host $UPCOMING_HOST  --port $UPCOMING_PORT --dbname $UPCOMING_DBNAME --user $UPCOMING_USER -f "create_old_tables.sql"

for table in ${OLD_TABLES[@]}; do
  echo "Import old ${table} from csv to upcoming db."
  psql --host $UPCOMING_HOST  --port $UPCOMING_PORT --dbname $UPCOMING_DBNAME --user $UPCOMING_USER -c "\copy old.${table} from './csv/${table}.csv' delimiter ','  csv header;"
done 

# [Upcoming DB] Migate old content to upcoming tables
# ----------------------------------------------------
export PGPASSWORD=$UPCOMING_PGPASSWORD

echo "Migate old content to upcoming tables"
psql --host $UPCOMING_HOST  --port $UPCOMING_PORT --dbname $UPCOMING_DBNAME --user $UPCOMING_USER -f "migration.sql"
