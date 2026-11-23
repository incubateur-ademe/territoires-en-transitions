# Versionné : aucune valeur secrète ici (les secrets arrivent par TF_VAR_ ou
# Secret Manager).

project_id = "ddfb298c-fbcf-4b11-a133-76200482002d"

# IP de sortie de l'instance Coolify de l'incubateur. La passerelle VPN est
# ajoutée d'office (platform.tf).
ssh_allowed_ips = ["51.15.216.229/32"]

# Clés SSH publiques des opérateurs (utilisateur tet-ops), une par opérateur.
# Commentaire de clé : prenom.nom, pas d'e-mail (fichier public).
server_ssh_authorized_keys = [
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINFY3vI0e/1bszOi6Qfe1nE1vZe22UrXpGH4COH8hYCM fred.arnoux",
]
