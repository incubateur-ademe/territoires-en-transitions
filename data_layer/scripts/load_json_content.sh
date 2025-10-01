#!/bin/sh

echo "Uploading json to endpoints at $API_URL/rest/v1/..."

echo "preuves.json into preuve_reglementaire_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/preuves.json \
"$API_URL/rest/v1/preuve_reglementaire_json"


echo "personnalisations.json into personnalisations_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/personnalisations.json \
"$API_URL/rest/v1/personnalisations_json"
