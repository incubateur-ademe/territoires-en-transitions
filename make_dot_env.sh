envsubst '${ANON_KEY}, ${API_URL}' < ./apps/app/.env.sample > ./apps/app/.env
envsubst '${SERVICE_ROLE_KEY}, ${ANON_KEY}, ${API_URL}' < ./e2e/.env.sample > ./e2e/.env
envsubst '${SERVICE_ROLE_KEY}, ${ANON_KEY}, ${API_URL}' < ./packages/api/.env.example > ./packages/api/.env
