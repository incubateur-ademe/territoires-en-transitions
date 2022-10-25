#!/bin/sh
echo "Uploading json to endpoints at $SUPABASE_URL/rest/v1/..."

echo "eci.json into referentiel_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/eci.json \
"$SUPABASE_URL/rest/v1/referentiel_json"

echo "cae.json into referentiel_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/cae.json \
"$SUPABASE_URL/rest/v1/referentiel_json"


echo "preuves.json into preuve_reglementaire_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/preuves.json \
"$SUPABASE_URL/rest/v1/preuve_reglementaire_json"
