export $(echo $(cat .env | sed 's/#.*//g' | sed 's/\r//g' | xargs) | envsubst)
envsubst '${ANON_KEY}, ${SERVICE_ROLE_KEY}' < kong.sample.yml > volumes/kong.yml
