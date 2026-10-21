# --- Manifeste des variables d'environnement ---
#
# LA liste des variables de chaque application, par environnement. Deux formes
# d'entrée, exclusives :
#
#   CLE = { value = "…" }                    en clair, versionné, relu en PR
#   CLE = { secret = "nom", multiline = … }  lu dans Secret Manager à l'apply :
#                                             tet-<env>-<nom> dans /coolify-env/<env>
#
# Le manifeste est public par construction (plan, outputs, logs CI) : jamais de
# valeur secrète en `value`. Les préconditions de env-push.tf le vérifient.
#
# Pas de variables partagées Coolify ({{environment.X}}) : une valeur commune à
# plusieurs applications vit dans un seul secret, lu pour chacune. Rotation et
# déduplication se font dans Secret Manager, sans référence à résoudre côté
# Coolify, donc sans risque de chaîne non interpolée au boot.
#
# Ne figurent ici que les clés requises par le code ou qui s'écartent de leur
# défaut. Références : apps/backend/src/utils/config/configuration.model.ts,
# packages/api/src/public-env.ts, apps/app/src/utils/runtime-env/.

locals {
  # Valeurs littérales propres à chaque environnement, réutilisées par
  # plusieurs applications : une seule source, ici.
  coolify_env_settings = {
    preprod = {
      secret_project_id = var.project_id
      env_name          = "preprod"
      app_url           = local.application_environments_catalog.preprod.domains.app[0]
      backend_url       = local.application_environments_catalog.preprod.domains.backend[0]
      site_url          = local.application_environments_catalog.preprod.domains.site[0]
      supabase_url      = "https://${local.service_environments_catalog.preprod.supabase_api_host}"
      # Nom propre à l'environnement : avec GoTrue self-hosté, le nom par défaut
      # (sb-supabase-api-auth-token) est le même partout, et les sessions des
      # environnements s'écrasent sur le domaine racine.
      supabase_auth_cookie_name = "sb-tet-preprod-auth-token"
      crisp_website_id          = "96fe7866-d005-4623-80b1-bd772e99855c"
    }
  }

  coolify_env_posthog_host = "https://p.territoiresentransitions.fr"

  # Secrets écrits par le stack du tier (infra/nonprod/coolify-env-secrets.tf) :
  # ce stack ne crée pas leur coquille.
  coolify_env_derived_secrets = [
    "supabase-database-url", "gotrue-db-database-url", "storage-db-database-url",
    "queue-redis-url", "queue-redis-tls-ca", "postgres-tls-ca",
  ]

  # Fournies par l'image ou par le déploiement : les poser dans Coolify
  # écraserait le ENV de l'image (/version figé sur un vieux SHA, healthcheck
  # menteur) ou produirait un diff à chaque apply.
  coolify_env_image_provided_keys = [
    "GIT_SHORT_HASH", "GIT_COMMIT_TIMESTAMP", "APPLICATION_VERSION",
    "GIT_COMMIT_SHORT_SHA", "DEPLOYMENT_TIMESTAMP",
    "NODE_ENV", "PORT", "HOSTNAME", "LANG",
  ]

  coolify_env_manifests = {
    preprod = {
      app = {
        ENV_NAME     = { value = local.coolify_env_settings.preprod.env_name }
        APP_URL      = { value = local.coolify_env_settings.preprod.app_url }
        BACKEND_URL  = { value = local.coolify_env_settings.preprod.backend_url }
        SITE_URL     = { value = local.coolify_env_settings.preprod.site_url }
        SUPABASE_URL = { value = local.coolify_env_settings.preprod.supabase_url }
        # Identique côté backend, qui lit ce cookie.
        SUPABASE_AUTH_COOKIE_NAME = { value = local.coolify_env_settings.preprod.supabase_auth_cookie_name }
        # Appels navigateur → backend par l'origine de l'app (app.…/api, cf.
        # applications.tf).
        BACKEND_BROWSER_URL = { value = local.coolify_env_settings.preprod.app_url }
        CRISP_WEBSITE_ID    = { value = local.coolify_env_settings.preprod.crisp_website_id }
        POSTHOG_HOST        = { value = local.coolify_env_posthog_host }
        SUPABASE_ANON_KEY   = { secret = "supabase-anon-key" }
        POSTHOG_KEY         = { secret = "posthog-key" }
      }

      backend = {
        ENV_NAME                  = { value = local.coolify_env_settings.preprod.env_name }
        APP_URL                   = { value = local.coolify_env_settings.preprod.app_url }
        SUPABASE_URL              = { value = local.coolify_env_settings.preprod.supabase_url }
        SUPABASE_AUTH_COOKIE_NAME = { value = local.coolify_env_settings.preprod.supabase_auth_cookie_name }

        SUPABASE_DATABASE_URL     = { secret = "supabase-database-url" }
        SUPABASE_JWT_SECRET       = { secret = "supabase-jwt-secret" }
        SUPABASE_SERVICE_ROLE_KEY = { secret = "supabase-service-role-key" }
        SUPABASE_ANON_KEY         = { secret = "supabase-anon-key" }

        QUEUE_REDIS_URL    = { secret = "queue-redis-url" }
        QUEUE_REDIS_TLS_CA = { secret = "queue-redis-tls-ca", multiline = true }

        # JSON compacté (jq -c .) avant dépôt : une ligne évite tout aller-retour
        # de retours à la ligne à travers le .env généré par Coolify.
        GCLOUD_SERVICE_ACCOUNT_KEY = { secret = "gcloud-service-account-key" }
        GOOGLE_CLOUD_PROJECT       = { value = "tet-gcloud" }
        GOOGLE_CLOUD_LOCATION      = { value = "eu" }
        GEMINI_MODEL               = { value = "gemini-3.5-flash" }
        ALBERT_MODEL               = { value = "gpt-oss-120b" }

        TRAJECTOIRE_SNBC_SHEET_ID           = { value = "1JsZyIVCa0qn2wGzilUeVUZ3hHm1GiIWA0DRwbtwguGQ" }
        TRAJECTOIRE_SNBC_XLSX_ID            = { value = "1EYPH3_rsJQFn0pZ1ONCQWlUeMUCyp6S3" }
        TRAJECTOIRE_SNBC_RESULT_FOLDER_ID   = { value = "1mxoT-dROWbr_RzaZzfJ78gbnkPqfHglX" }
        REFERENTIEL_TE_SHEET_ID             = { value = "13HGNkJez8wiLpjQEoKS_C1ibYIrHPEYCS5I6lP9F_gs" }
        REFERENTIEL_CAE_SHEET_ID            = { value = "1c8cPHSSulW8SAraqmVq1zH3hOQDYQB6yRa9w8Q1zdzE" }
        REFERENTIEL_ECI_SHEET_ID            = { value = "1obiQ6ijwvjmJoHuMeE0O1pKaz2eqbt43iFr7xYbc4oA" }
        INDICATEUR_DEFINITIONS_SHEET_ID     = { value = "1im08NvNBGsVb-xB2Lmh-3sgKO7Tje7jUAYQOCNixnuM" }
        PERSONNALISATION_QUESTIONS_SHEET_ID = { value = "14zHHgti8nkDI7URZ6VTaJ4ARLr9SJAtOHnQtjs41AYA" }

        BREVO_API_KEY                        = { secret = "brevo-api-key" }
        MATTERMOST_NOTIFICATIONS_WEBHOOK_URL = { secret = "mattermost-notifications-webhook-url" }

        POSTHOG_HOST = { value = local.coolify_env_posthog_host }
        POSTHOG_KEY  = { secret = "posthog-key" }

        # Les deux URI doivent être déclarées chez l'ADEME pour ce client.
        MON_COMPTE_ADEME_ENABLED                  = { value = "true" }
        MON_COMPTE_ADEME_ISSUER                   = { value = "https://preprod-fa.ademe.fr/auth/realms/master" }
        MON_COMPTE_ADEME_CLIENT_ID                = { value = "preprod-territoiresentransitions" }
        MON_COMPTE_ADEME_CLIENT_SECRET            = { secret = "mon-compte-ademe-client-secret" }
        MON_COMPTE_ADEME_REDIRECT_URI             = { value = "${local.coolify_env_settings.preprod.backend_url}/api/v1/moncompteademe/callback" }
        MON_COMPTE_ADEME_POST_LOGOUT_REDIRECT_URI = { value = "${local.coolify_env_settings.preprod.backend_url}/api/v1/moncompteademe/logout/callback" }
        OIDC_TICKET_SECRET                        = { secret = "oidc-ticket-secret" }

        # Lues par le SDK OpenTelemetry (utils/telemetry-init.ts), pas par le
        # schéma de configuration. L'authentification vient de POSTHOG_KEY.
        OTEL_EXPORTER_OTLP_ENDPOINT = { value = "https://eu.i.posthog.com/i" }
        OTEL_SERVICE_NAME           = { value = "backend" }
        OTEL_RESOURCE_ATTRIBUTES    = { value = "deployment.environment.name=preprod" }
      }

      # Le reste de la configuration du site est inliné au build (NEXT_PUBLIC_*,
      # image taguée <env>-<sha> par cd-site.yml) : seules les lectures runtime
      # du serveur figurent ici.
      site = {
        POSTHOG_HOST   = { value = local.coolify_env_posthog_host }
        POSTHOG_KEY    = { secret = "posthog-key" }
        PCAET_LAUNCHED = { value = "true" }
        DB_STATS_URL   = { secret = "db-stats-url" }
      }

      # Variables du compose infra/nonprod/supabase-api/docker-compose.yml :
      # toutes ses ${VAR}, rien d'autre (le manifeste fait autorité).
      supabase-api = {
        STACK_ENV         = { value = local.coolify_env_settings.preprod.env_name }
        SUPABASE_API_HOST = { value = local.service_environments_catalog.preprod.supabase_api_host }

        # Aussi {{ .SiteURL }} des templates d'email : liens vers /login et
        # /signup de l'app.
        GOTRUE_SITE_URL = { value = local.coolify_env_settings.preprod.app_url }
        GOTRUE_URI_ALLOW_LIST = { value = join(",", [
          local.coolify_env_settings.preprod.app_url,
          local.coolify_env_settings.preprod.backend_url,
          local.coolify_env_settings.preprod.site_url,
        ]) }

        # Le même secret que le backend : un JWT signé par GoTrue doit passer
        # chez Storage et chez le backend.
        SUPABASE_JWT_SECRET       = { secret = "supabase-jwt-secret" }
        SUPABASE_ANON_KEY         = { secret = "supabase-anon-key" }
        SUPABASE_SERVICE_ROLE_KEY = { secret = "supabase-service-role-key" }

        GOTRUE_DB_DATABASE_URL   = { secret = "gotrue-db-database-url" }
        STORAGE_DB_DATABASE_URL  = { secret = "storage-db-database-url" }
        STORAGE_DB_SSL_ROOT_CERT = { secret = "postgres-tls-ca", multiline = true }

        # 2525 tant que Scaleway n'a pas débloqué 25/465/587 sur le projet.
        BREVO_SMTP_HOST         = { value = "smtp-relay.brevo.com" }
        BREVO_SMTP_PORT         = { value = "2525" }
        BREVO_SMTP_USER         = { secret = "brevo-smtp-user" }
        BREVO_SMTP_PASS         = { secret = "brevo-smtp-pass" }
        BREVO_SMTP_SENDER_EMAIL = { value = "notifications@territoiresentransitions.fr" }
        BREVO_SMTP_SENDER_NAME  = { value = "Territoires en Transitions" }

        # Bucket de infra/nonprod/storage.tf, clé IAM de storage.tf, rangée à la main.
        SCW_S3_BUCKET         = { value = "tet-preprod-storage" }
        SCW_ACCESS_KEY_ID     = { secret = "supabase-storage-s3-access-key-id" }
        SCW_SECRET_ACCESS_KEY = { secret = "supabase-storage-s3-secret-access-key" }
      }
    }
  }

  # Une entrée par application (applications.tf) ou service (services.tf)
  # déclaré dont l'environnement a un manifeste. Les entrées sont mises sous la forme attendue par
  # scripts/coolify-push-env.sh, noms de secrets complets.
  coolify_env_pushes = {
    for id, a in merge(
      { for k, v in local.applications : k => merge(v, { resource = "applications" }) },
      { for k, v in local.services : k => merge(v, { resource = "services" }) },
      ) : id => {
      env               = a.env
      app               = a.app
      resource          = a.resource
      secret_project_id = local.coolify_env_settings[a.env].secret_project_id
      secret_path       = "/coolify-env/${a.env}"
      entries           = local.coolify_env_manifests[a.env][a.app]
      manifest = [
        for key in sort(keys(local.coolify_env_manifests[a.env][a.app])) : merge(
          { key = key, multiline = try(local.coolify_env_manifests[a.env][a.app][key].multiline, false) },
          try({ value = local.coolify_env_manifests[a.env][a.app][key].value }, {}),
          try({ secret = "tet-${a.env}-${local.coolify_env_manifests[a.env][a.app][key].secret}" }, {}),
        )
      ]
    } if contains(keys(local.coolify_env_manifests), a.env)
  }

  # Secrets saisis à la main, dont ce stack crée la coquille (env-secrets.tf).
  coolify_env_manual_secrets = toset(flatten([
    for env, apps in local.coolify_env_manifests : [
      for app, entries in apps : [
        for key, e in entries : "${env}/${e.secret}"
        if try(e.secret, null) != null && !contains(local.coolify_env_derived_secrets, try(e.secret, ""))
      ]
    ] if contains(var.application_environments, env)
  ]))
}
