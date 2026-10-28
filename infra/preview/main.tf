# Tier preview : environnements éphémères, un par pull request.
#
# Aucune ressource managée ici. Chaque preview embarque son propre Postgres et
# son propre Redis conteneurisés, créés et détruits avec elle — provisionner une
# instance RDB par PR serait lent (plusieurs minutes) et coûteux à l'unité.
#
# Ce stack ne fait que fournir le socle : le serveur et le ramasse-miettes
# disque. La création et la destruction d'une stack par PR via l'API Coolify
# restent à câbler côté CI.

module "app_server" {
  source = "../modules/app-server"

  tier                   = "preview"
  zone                   = var.scaleway_zone
  instance_type          = var.server_instance_type
  root_volume_size_in_gb = var.server_root_volume_size_in_gb

  private_network_id   = var.private_network_id
  private_ipv4_address = var.server_private_ipv4_address

  # Port 22 fermé sur l'IP publique : l'accès passe par le bastion Coolify.
  ssh_allowed_ips     = []
  ssh_authorized_keys = var.server_ssh_authorized_keys

  # Chaque PR tire de nouvelles images et laisse derrière elle des couches
  # orphelines. Sans GC, le volume racine sature en quelques semaines.
  docker_gc_enabled = true
  docker_gc_until   = var.docker_gc_until

  # Rien à préserver : chaque preview est recréable depuis sa PR.
  deletion_protection = false
}
