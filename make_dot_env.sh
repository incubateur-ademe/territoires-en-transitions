envsubst '${SUPABASE_SERVICE_ROLE_KEY}, ${SUPABASE_ANON_KEY}' < ./data_layer/supabase/kong.sample.yml > ./data_layer/supabase/kong.yml
envsubst '${SUPABASE_SERVICE_ROLE_KEY}, ${SUPABASE_ANON_KEY}' < ./data_layer/requests/http-client.sample.json > ./data_layer/requests/http-client.env.json
envsubst '${SUPABASE_SERVICE_ROLE_KEY}, ${SUPABASE_ANON_KEY}' < ./.env.sample > ./.env
envsubst '${SUPABASE_SERVICE_ROLE_KEY}' < ./business/.env.sample > ./business/.env
envsubst '${SUPABASE_ANON_KEY}' < ./app.territoiresentransitions.react/.env.sample > ./app.territoiresentransitions.react/.env
envsubst '${SUPABASE_SERVICE_ROLE_KEY}' < ./e2e/.env.sample > ./e2e/.env
