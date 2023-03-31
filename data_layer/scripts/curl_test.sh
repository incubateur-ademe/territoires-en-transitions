#!/bin/sh

echo "Getting content at $URL/rest/v1/..."

curl -X GET \
     -H "apikey: $ANON_KEY" \
     -H "Authorization: Bearer $ANON_KEY" \
     -H "Accept: text/csv" \
"$URL/rest/v1/collectivite_card?select=nom"
