#!/bin/sh
POSTGREST_VERSION=$(curl -s "$URL/rest/v1/" | jq -r ".info.version")
echo "verification de PostgREST avec l'url: $URL, version: $POSTGREST_VERSION"
until curl --fail -X POST "$URL/rest/v1/rpc/is_authenticated" \
            -H "Content-Type: application/json" \
            -H "apikey: $API_KEY" \
            -H "Authorization: Bearer $API_KEY"; do
    sleep 1
    echo "Attends que la rpc is_authenticated soit disponible."
done

echo "Télécharge les noms depuis la vue collectivite_card."
curl -v -X GET \
     -H "apikey: $API_KEY" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Accept: text/csv" \
"$URL/rest/v1/collectivite_card?select=nom"

echo "Appelle la RPC test_reset."
curl -v -X POST \
     -H "apikey: $API_KEY" \
     -H "Authorization: Bearer $API_KEY" \
"$URL/rest/v1/rpc/test_reset"
