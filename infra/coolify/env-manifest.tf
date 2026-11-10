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
      axeptio_id                = "65ef34473dcae5d0c7a47699"
      strapi_url                = "https://phenomenal-trust-ee3da2c906.strapiapp.com"
    }
    # Pour l'instant, seules les applications Git y tournent. Secrets dans le
    # projet tet-prod, celui du serveur.
    prod = {
      secret_project_id = local.server_key_project_ids.prod
      env_name          = "prod"
      app_url           = local.application_environments_catalog.prod.domains.app[0]
      backend_url       = local.application_environments_catalog.prod.domains.backend[0]
      site_url          = local.application_environments_catalog.prod.domains.site[0]
      crisp_website_id  = "582ff50a-5ac4-4f38-a8bc-62f51beeef89"
      axeptio_id        = "65ef34473dcae5d0c7a47699"
      strapi_url        = "https://phenomenal-trust-ee3da2c906.strapiapp.com"
    }
  }

  coolify_env_posthog_host = "https://p.territoiresentransitions.fr"

  # Secrets écrits par le stack du tier (infra/nonprod/coolify-env-secrets.tf) :
  # ce stack ne crée pas leur coquille.
  coolify_env_derived_secrets = [
    "supabase-database-url", "gotrue-db-database-url", "storage-db-database-url",
    "queue-redis-url", "queue-redis-tls-ca", "postgres-tls-ca",
    "cockpit-token", "cockpit-metrics-push-url", "cockpit-logs-push-url",
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

        SUPABASE_DATABASE_URL           = { secret = "supabase-database-url" }
        SUPABASE_DATABASE_SSL_ROOT_CERT = { secret = "postgres-tls-ca", multiline = true }
        SUPABASE_JWT_SECRET             = { secret = "supabase-jwt-secret" }
        SUPABASE_SERVICE_ROLE_KEY       = { secret = "supabase-service-role-key" }
        SUPABASE_ANON_KEY               = { secret = "supabase-anon-key" }

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

        BREVO_API_KEY = { secret = "brevo-api-key" }

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

        # clamd du serveur (applications.tf), par son alias réseau. Port 3310 par
        # défaut. Mode audit par défaut : rien n'est supprimé.
        CLAMAV_HOST = { value = "clamav" }

        # Emails vers le Mailpit du serveur (applications.tf), par son alias
        # réseau. Le mot de passe est celui de mailpit-auth.
        SMTP_URL  = { value = "smtp://tet@mailpit:1025" }
        SMTP_KEY  = { secret = "mailpit-password" }
        SMTP_FROM = { value = "Territoires en Transitions <notifications@territoiresentransitions.fr>" }
      }

      # Toute la configuration du site est lue au runtime, comme pour l'app
      # (cf. packages/api/src/public-env.ts) : une seule image tet-site:<sha>
      # pour tous les environnements.
      site = {
        ENV_NAME         = { value = local.coolify_env_settings.preprod.env_name }
        APP_URL          = { value = local.coolify_env_settings.preprod.app_url }
        BACKEND_URL      = { value = local.coolify_env_settings.preprod.backend_url }
        SITE_URL         = { value = local.coolify_env_settings.preprod.site_url }
        CRISP_WEBSITE_ID = { value = local.coolify_env_settings.preprod.crisp_website_id }
        AXEPTIO_ID       = { value = local.coolify_env_settings.preprod.axeptio_id }
        STRAPI_URL       = { value = local.coolify_env_settings.preprod.strapi_url }
        STRAPI_KEY       = { secret = "strapi-key" }
        POSTHOG_HOST     = { value = local.coolify_env_posthog_host }
        POSTHOG_KEY      = { secret = "posthog-key" }
        PCAET_LAUNCHED   = { value = "true" }
        DB_STATS_URL     = { secret = "db-stats-url" }
      }

      # Variables du compose infra/nonprod/supabase-api/docker-compose.yml :
      # toutes ses ${VAR} sauf STACK_ENV et SUPABASE_API_HOST, substitués dans
      # le compose par services.tf (labels Traefik). Le manifeste fait autorité.
      supabase-api = {
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

        # Mailpit du serveur (applications.tf), par l'IP privée : GoTrue n'est
        # pas sur le réseau coolify. En prod : Brevo (smtp-relay.brevo.com,
        # port 2525 tant que Scaleway bloque 25/465/587).
        SMTP_HOST         = { value = var.app_servers.nonprod.ssh_host }
        SMTP_PORT         = { value = "1025" }
        SMTP_USER         = { value = "tet" }
        SMTP_PASS         = { secret = "mailpit-password" }
        SMTP_SENDER_EMAIL = { value = "notifications@territoiresentransitions.fr" }
        SMTP_SENDER_NAME  = { value = "Territoires en Transitions (${local.coolify_env_settings.preprod.env_name})" }

        # Bucket de infra/nonprod/storage.tf, clé IAM de storage.tf, rangée à la main.
        SCW_S3_BUCKET         = { value = "tet-preprod-storage" }
        SCW_ACCESS_KEY_ID     = { secret = "supabase-storage-s3-access-key-id" }
        SCW_SECRET_ACCESS_KEY = { secret = "supabase-storage-s3-secret-access-key" }
      }

      # Variables du compose infra/observability/alloy/docker-compose.yml.
      # Token et URL de push : Cockpit du projet principal (infra/nonprod/observability.tf).
      alloy = {
        SERVER_NAME = { value = var.app_servers.nonprod.name }
        ENV_NAME    = { value = local.coolify_env_settings.preprod.env_name }

        COCKPIT_TOKEN            = { secret = "cockpit-token" }
        COCKPIT_METRICS_PUSH_URL = { secret = "cockpit-metrics-push-url" }
        COCKPIT_LOGS_PUSH_URL    = { secret = "cockpit-logs-push-url" }

        PROBE_APP_URL     = { value = local.coolify_env_settings.preprod.app_url }
        PROBE_BACKEND_URL = { value = "${local.coolify_env_settings.preprod.backend_url}/version" }
        PROBE_SITE_URL    = { value = local.coolify_env_settings.preprod.site_url }
        PROBE_AUTH_URL    = { value = "${local.coolify_env_settings.preprod.supabase_url}/auth/v1/health" }
        PROBE_STORAGE_URL = { value = "${local.coolify_env_settings.preprod.supabase_url}/storage/v1/status" }
      }

      # MP_*_AUTH : « tet:<mot de passe> », même mot de passe que
      # mailpit-password (lu par les expéditeurs). Les deux secrets changent
      # ensemble.
      mailpit = {
        MP_SMTP_AUTH                = { secret = "mailpit-auth" }
        MP_SMTP_AUTH_ALLOW_INSECURE = { value = "true" }
        MP_UI_AUTH                  = { secret = "mailpit-auth" }
        # Volume non persistant : la boîte se vide au redéploiement.
        MP_MAX_MESSAGES = { value = "5000" }
      }

      # Variables lues par l'entrypoint de l'image officielle.
      clamav = {
        # 25M par défaut, sous la limite de taille de Storage.
        CLAMD_CONF_StreamMaxLength = { value = "60M" }
        # Sans quoi clamd garde deux bases en mémoire pendant un rechargement,
        # sur un serveur partagé. L'analyse attend la fin du rechargement.
        CLAMD_CONF_ConcurrentDatabaseReload = { value = "no" }
        FRESHCLAM_CHECKS                    = { value = "24" }
      }

      # Application Git (git-applications.tf). HOSTNAME et PROTOCOL forment les
      # liens absolus des pages et des exports.
      aldo = {
        HOSTNAME                  = { value = trimprefix(local.git_applications_catalog["preprod/aldo"].domains[0], "https://") }
        PROTOCOL                  = { value = "https" }
        ALDO_EMAIL                = { value = "aldo@ademe.fr" }
        GOOGLE_SHEETS_ID          = { value = "1utt1PDrsTXpIpGPIxm5W4HPXH2EZNghAOsPpbZ67swU" }
        GOOGLE_SHEETS_CREDENTIALS = { secret = "aldo-google-sheets-credentials" }
        SIB_API_KEY               = { secret = "aldo-brevo-api-key" }
        SLACK_COMMUNITY_URL       = { value = "https://join.slack.com/t/opencarbonpractice/shared_invite/zt-3gmnrmvcg-PNPWejQ8fLSHfIsQHtqoEQ" }
      }
    }

    prod = {
      # Comme preprod. app et backend restent sur Koyeb, sous les mêmes noms.
      site = {
        ENV_NAME         = { value = local.coolify_env_settings.prod.env_name }
        APP_URL          = { value = local.coolify_env_settings.prod.app_url }
        BACKEND_URL      = { value = local.coolify_env_settings.prod.backend_url }
        SITE_URL         = { value = local.coolify_env_settings.prod.site_url }
        CRISP_WEBSITE_ID = { value = local.coolify_env_settings.prod.crisp_website_id }
        AXEPTIO_ID       = { value = local.coolify_env_settings.prod.axeptio_id }
        STRAPI_URL       = { value = local.coolify_env_settings.prod.strapi_url }
        STRAPI_KEY       = { secret = "strapi-key" }
        POSTHOG_HOST     = { value = local.coolify_env_posthog_host }
        POSTHOG_KEY      = { secret = "posthog-key" }
        PCAET_LAUNCHED   = { value = "true" }
        DB_STATS_URL     = { secret = "db-stats-url" }
      }

      aldo = {
        HOSTNAME                  = { value = trimprefix(local.git_applications_catalog["prod/aldo"].domains[0], "https://") }
        PROTOCOL                  = { value = "https" }
        ALDO_EMAIL                = { value = "aldo@ademe.fr" }
        GOOGLE_SHEETS_ID          = { value = "1utt1PDrsTXpIpGPIxm5W4HPXH2EZNghAOsPpbZ67swU" }
        GOOGLE_SHEETS_CREDENTIALS = { secret = "aldo-google-sheets-credentials" }
        SIB_API_KEY               = { secret = "aldo-brevo-api-key" }
        SLACK_COMMUNITY_URL       = { value = "https://join.slack.com/t/opencarbonpractice/shared_invite/zt-3gmnrmvcg-PNPWejQ8fLSHfIsQHtqoEQ" }
      }

      # Base Postgres et Storage restent sur leur projet Supabase Cloud.
      rencontres = {
        WEBSITE_URL              = { value = local.git_applications_catalog["prod/rencontres"].domains[0] }
        NEXT_PUBLIC_SUPABASE_URL = { value = "https://eazuwwpllqueujyivlce.supabase.com" }
        DATABASE_URL             = { secret = "rencontres-database-url" }
        SUPABASE_KEY             = { secret = "rencontres-supabase-key" }
        JWT_SECRET               = { secret = "rencontres-jwt-secret" }
        BREVO_KEY                = { secret = "rencontres-brevo-key" }
        # La même clé des deux côtés : le client l'envoie à l'API admin.
        # FAILLE connue de rencontres-tete, reprise telle quelle de Koyeb :
        # NEXT_PUBLIC_* est inlinée dans le bundle navigateur, la clé admin est
        # donc publique. Correctif dans rencontres-tete (contrôle côté serveur
        # par session/JWT, ou route serveur qui ajoute la clé), puis retirer
        # NEXT_PUBLIC_ADMIN_KEY ici. Nouvelle valeur à la bascule : l'ancienne
        # a fuité.
        ADMIN_API_KEY         = { secret = "rencontres-admin-api-key" }
        NEXT_PUBLIC_ADMIN_KEY = { secret = "rencontres-admin-api-key" }
        # Relances par email planifiées dans le process (lib/cron.js) : coupées
        # tant que Koyeb tourne, sinon chaque relance part deux fois. À passer
        # à true à la bascule, Koyeb en pause.
        CRON_ENABLED = { value = "false" }
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
      { for k, v in local.alloy_services : k => merge(v, { resource = "services" }) },
      { for k, v in local.tool_applications : k => merge(v, { resource = "applications" }) },
      { for k, v in local.git_applications : k => merge(v, { resource = "applications", git = true }) },
      ) : id => {
      env      = a.env
      app      = a.app
      resource = a.resource
      # Application construite depuis son dépôt (git-applications.tf) : les
      # règles propres aux images TET (clés fournies par l'image, pas de
      # NEXT_PUBLIC_*) ne s'appliquent pas.
      git               = try(a.git, false)
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

  # Secrets saisis à la main, dont ce stack crée la coquille (env-secrets.tf) :
  # ceux des ressources déclarées.
  coolify_env_manual_secrets = toset(flatten([
    for id, p in local.coolify_env_pushes : [
      for key, e in p.entries : "${p.env}/${e.secret}"
      if try(e.secret, null) != null && !contains(local.coolify_env_derived_secrets, try(e.secret, ""))
    ]
  ]))
}
