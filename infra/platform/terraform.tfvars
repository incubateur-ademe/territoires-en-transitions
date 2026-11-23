# Versionné : aucune valeur secrète ici (les secrets arrivent par TF_VAR_ ou
# Secret Manager).

# Projets créés par l'admin de l'organisation (cf. README « Prérequis admin »).
main_project_id             = "ddfb298c-fbcf-4b11-a133-76200482002d"
prod_project_id             = "ab89df2d-0d28-4b5b-9ad8-74e5160e9a31"
coolify_backups_project_id  = "1174f0ae-225a-4117-8bbe-83103876be40"
database_backups_project_id = "6f1fbb1d-dbe8-4de6-bfdc-42b1a0c61404"

# --- VPN des opérateurs (cf. README « Accès aux serveurs (VPN) ») ---

# Un pair par opérateur : sa clé publique (wg pubkey) et son adresse dans le
# tunnel (10.99.0.1 est la passerelle).
vpn_peers = {
  "fred.arnoux" = { public_key = "aX23oguuyiHmi8JXSVwaaRmTBGkrd6qeQtgjh1uNlTg=", address = "10.99.0.2" }
}

# Clés SSH publiques des opérateurs qui administrent la passerelle
# (ssh tet-ops@10.99.0.1). Commentaire de clé : prenom.nom, pas d'e-mail.
vpn_ssh_authorized_keys = [
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINFY3vI0e/1bszOi6Qfe1nE1vZe22UrXpGH4COH8hYCM fred.arnoux",
]
