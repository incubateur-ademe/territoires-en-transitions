# Serveur du tier data, dans la Team Coolify « TeT - Data ».
#
# Coolify donne ses droits par Team : le data analyst, membre de « TeT - Data »
# (invitation dans l'UI, le provider n'a pas de ressource pour ça), y déploie
# Streamlit, Metabase, le MCP et les scripts de calcul sans rien voir de notre
# Team, qui porte la prod.
#
# Ici et non dans infra/coolify : ce stack-là porte la prod et ne doit dépendre
# ni du token de cette Team ni de l'existence de la VM data.
#
# Pas de login GHCR : la Team « TeT - Data » ouvre un terminal root sur le
# serveur, le PAT du secret tet-platform-ghcr-pull y serait lisible, et il
# donne accès à toutes les images de l'org, prod comprise.

resource "coolify_private_key" "server" {
  name        = "${module.app_server.server_name}-root"
  description = "Clé root du serveur ${module.app_server.server_name}. Gérée par Terraform (infra/data). Privée dans Secret Manager (${module.app_server.ssh_key_secret_name})."
  private_key = module.app_server.ssh_private_key
}

# Le provider supprime un serveur en ?force=true, donc avec toutes les
# ressources qu'il héberge : prevent_destroy. Coolify ne renvoie pas
# private_key_uuid en GET : le provider garde la valeur du HCL (cf.
# coolify_server.app dans infra/coolify/main.tf).
#
# ip : l'IP publique. L'instance Coolify de l'incubateur est hors de nos VPC.
resource "coolify_server" "server" {
  name             = module.app_server.server_name
  description      = "Tier data. Géré par Terraform (infra/data). (tet-server=data)"
  ip               = module.app_server.public_ip
  user             = "root"
  port             = 22
  private_key_uuid = coolify_private_key.server.uuid
  is_build_server  = false

  lifecycle {
    prevent_destroy = true
  }
}

# Mêmes valeurs que les serveurs de notre Team (infra/coolify/main.tf).
resource "coolify_server_docker_cleanup" "server" {
  server_uuid              = coolify_server.server.uuid
  docker_cleanup_frequency = "0 0 * * *"
  docker_cleanup_threshold = 80
  force_docker_cleanup     = true
  delete_unused_volumes    = false
  delete_unused_networks   = false
}
