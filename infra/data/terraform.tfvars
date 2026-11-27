# Versionné : aucune valeur secrète ici (les secrets arrivent par TF_VAR_ ou
# Secret Manager). Le token de la Team Coolify « TeT - Data » arrive par
# TF_VAR_coolify_data_token :
#
#   source infra/scripts/tf-env.sh
#   source infra/scripts/coolify-env.sh

project_id = "ddfb298c-fbcf-4b11-a133-76200482002d"

# Projet de production : seule l'IP publique de son serveur y est lue.
prod_project_id = "ab89df2d-0d28-4b5b-9ad8-74e5160e9a31"

# Backends applicatifs autorisés à lire la base de stats (endpoint public + ACL).
# Ajouter "prod" quand le backend de prod aura quitté Koyeb, dont les IP de
# sortie ne sont pas fixes.
pg_public_reader_tiers     = ["nonprod"]
pg_public_endpoint_enabled = true

# Instance Coolify de l'incubateur (Team « TeT - Data »).
coolify_endpoint = "https://ops.incubateur.ademe.fr/api/v1"

# IP de sortie de l'instance Coolify de l'incubateur. La passerelle VPN est
# ajoutée d'office (platform.tf).
ssh_allowed_ips = ["51.15.216.229/32"]

# Clés SSH publiques des opérateurs (utilisateur tet-ops), une par opérateur.
# Commentaire de clé : prenom.nom, pas d'e-mail (fichier public).
server_ssh_authorized_keys = [
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINFY3vI0e/1bszOi6Qfe1nE1vZe22UrXpGH4COH8hYCM fred.arnoux",
]
