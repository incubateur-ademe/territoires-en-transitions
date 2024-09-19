#!/bin/sh

echo "Uploading json to endpoints at $API_URL/rest/v1/..."

echo "indicateurs.json into indicateurs_json"
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/indicateurs.json \
"$API_URL/rest/v1/indicateurs_json"

