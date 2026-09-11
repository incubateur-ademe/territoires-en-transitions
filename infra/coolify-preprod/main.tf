# Clé privée SSH host, lue depuis Scaleway Secret Manager (créée par
# infra/preprod, module coolify → tls_private_key + scaleway_secret).
# `data` est renvoyé en base64 par le provider → on décode pour obtenir la clé
# OpenSSH telle quelle.
data "scaleway_secret_version" "host_key" {
  secret_name = var.host_key_secret_name
  revision    = "latest"
}

# Enregistre la clé host dans Coolify (équivalent Keys & Tokens > Add Private Key),
# de façon déclarative et idempotente. C'est le socle réutilisable : les projects
# et applications viendront s'ajouter dans cette même couche par la suite.
resource "coolify_private_key" "host" {
  name        = "tet-preprod-coolify-host"
  description = "Clé host pilotant le serveur localhost. Gérée par Terraform (infra/coolify-preprod). Privée dans Secret Manager (${var.host_key_secret_name})."
  private_key = base64decode(data.scaleway_secret_version.host_key.data)
}

# Assignation de la clé au serveur localhost + validation.
#
# Fait via l'API REST (endpoints vérifiés dans openapi.yaml : GET /servers puis
# PATCH /servers/{uuid} avec private_key_uuid + instant_validate) plutôt que via
# la ressource coolify_server du provider, marquée « not fully implemented ».
# Raison de fond : le serveur localhost héberge les projects en cours ; le faire
# gérer par une ressource incomplète risquerait un drift destructeur. On isole
# donc ce seul geste dans un script idempotent.
resource "terraform_data" "assign_host_key" {
  # Re-exécute si la clé change (rotation / recréation).
  triggers_replace = [coolify_private_key.host.uuid]

  provisioner "local-exec" {
    command = "${path.module}/../scripts/coolify-assign-host-key.sh"
    environment = {
      COOLIFY_ENDPOINT = var.coolify_endpoint
      HOST_KEY_UUID    = coolify_private_key.host.uuid
      # COOLIFY_TOKEN est hérité de l'environnement (coolify-env.sh).
    }
  }
}
