envsubst '${SERVICE_ROLE_KEY}' < ./business/.env.sample > ./business/.env
envsubst '${ANON_KEY}, ${API_URL}' < ./app.territoiresentransitions.react/.env.sample > ./app.territoiresentransitions.react/.env
envsubst '${SERVICE_ROLE_KEY}, ${ANON_KEY}, ${API_URL}' < ./e2e/.env.sample > ./e2e/.env
envsubst '${SERVICE_ROLE_KEY}, ${ANON_KEY}, ${API_URL}' < ./api_tests/.env.example > ./api_tests/.env
envsubst '${SERVICE_ROLE_KEY}, ${ANON_KEY}, ${API_URL}' < ./packages/api/.env.example > ./packages/api/.env
envsubst '${ANON_KEY}, ${API_URL}' < ./packages/auth/.env.sample > ./packages/auth/.env
