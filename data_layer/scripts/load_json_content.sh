#!/bin/sh
echo "Uploading json to $SUPABASE_URL/rest/v1/..."
curl -X POST \
     -H "apikey: $SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d @../content/preuves.json \
"$SUPABASE_URL/rest/v1/preuve_reglementaire_json"
