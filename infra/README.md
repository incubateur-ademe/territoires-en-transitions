# `infra/` — Infrastructure as Code Scaleway

Terraform qui décrit l'infrastructure cible TET sur Scaleway, dans le cadre de la migration depuis Supabase Cloud + Koyeb. Voir le brainstorm de référence :
[`doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md`](../doc/plans/2026-05-15-001-migration-infra-supabase-koyeb-vers-scaleway-coolify.md).

## Structure

```
infra/
├── modules/
│   └── postgres/       Module réutilisable pour une instance RDB Postgres managée
└── preprod/            Environnement preprod (premier env provisionné, terrain de test)
    ├── backend.tf      State distant sur Scaleway Object Storage (S3)
    ├── providers.tf    Provider Scaleway
    ├── variables.tf    Variables d'entrée
    ├── main.tf         Appel des modules
    ├── outputs.tf      Sorties (endpoint, mots de passe, URI)
    └── terraform.tfvars.example
```

Les environnements `staging/` et `prod/` seront ajoutés ultérieurement, en réutilisant le même module avec des valeurs adaptées.

## Pré-requis

- **Terraform >= 1.6.0** (`tfenv use 1.9.x` recommandé)
- **Compte Scaleway** avec un projet dédié par environnement
- **Clés d'accès Scaleway** (Access Key + Secret Key) pour l'IAM utilisateur ou applicatif qui pilote Terraform
- **Bucket Scaleway Object Storage** dédié au state Terraform (cf. Bootstrap ci-dessous)

## Bootstrap initial (une fois par environnement)

Le bucket de state Terraform doit exister **avant** le premier `terraform init`. Étapes manuelles :

```sh
# 1. Créer un projet Scaleway dédié à preprod via la console
#    https://console.scaleway.com/project/

# 2. Créer le bucket de state via le CLI scw (à exécuter dans un terminal
#    authentifié : `scw init` ou variables d'env SCW_ACCESS_KEY / SCW_SECRET_KEY)
scw object bucket create name=tet-tfstate region=fr-par

# 3. Activer le versioning du bucket (filet de sécurité en cas de corruption de state)
scw object bucket update name=tet-tfstate region=fr-par versioning.enabled=true

# 4. (Recommandé) activer le verrouillage d'objets en mode "governance" 30 jours
#    pour se prémunir d'une suppression accidentelle du state.
```

## Workflow en local

```sh
cd infra/preprod

# Renseigner les variables (UUID projet, IPs autorisées, etc.)
cp terraform.tfvars.example terraform.tfvars
$EDITOR terraform.tfvars

# Exporter les credentials S3 pour le backend (les mêmes que Scaleway,
# le backend S3 utilise les conventions de nommage AWS) :
export AWS_ACCESS_KEY_ID="$(scw config get access-key)"
export AWS_SECRET_ACCESS_KEY="$(scw config get secret-key)"

terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan
terraform apply tfplan
```

Après le premier apply, **récupérer immédiatement** le mot de passe admin et le stocker dans Scaleway Secret Manager (ou un coffre équivalent) :

```sh
terraform output -raw pg_admin_password
# → copier dans Scaleway Secret Manager sous le nom "tet-preprod-pg-admin-password"
terraform output -raw pg_connection_uri
# → idem, "tet-preprod-pg-connection-uri"
```

Ces secrets pourront ensuite être référencés par les workflows GitHub Actions et la configuration Coolify.

## State backend : limitation connue

Le backend S3 Scaleway **ne supporte pas le state locking**. Discipline d'équipe requise :

- **Un seul apply à la fois** — coordination via Slack (`#tet-infra` ou équivalent)
- En cas de doute, vérifier dans la console Scaleway Object Storage la dernière date de modification de `tet-tfstate/preprod/terraform.tfstate` avant un apply
- Si la taille d'équipe grandit ou si des applies concurrents deviennent fréquents, migrer vers Terraform Cloud (gratuit jusqu'à 5 utilisateurs, locking et audit inclus)

## Hygiène

```sh
# Formatage cohérent
terraform fmt -recursive

# Validation syntaxe / typage
cd preprod && terraform validate

# Linting (à installer : https://github.com/terraform-linters/tflint)
tflint --recursive
```

Le lockfile `.terraform.lock.hcl` de chaque environnement **doit être versionné** — il fige les versions exactes des providers et garantit la reproductibilité.

## CI/CD (à venir)

Workflow `.github/workflows/ci-infra.yml` à créer :

- Déclenchement sur PR si `infra/**` est modifié
- `terraform fmt -check` + `terraform validate` + `terraform plan` en commentaire de PR
- Sur merge `main`, `terraform apply` avec approbation manuelle (GitHub Environments)
- Authentification Scaleway via OIDC GitHub → IAM Scaleway (pas de clés long-lived dans les secrets repo)

## Décisions architecturales actées

- **Mono-VM Coolify** plutôt que Kapsule (cf. brainstorm) : pas d'orchestrateur K8s
- **State backend S3 Scaleway sans locking** : choix "minimal" assumé pour démarrer
- **GoTrue self-hosté** plutôt que self-hosting complet de Supabase : préserve JWT_SECRET, schéma auth, bcrypt
- **Sous-domaines dédiés par service** plutôt que reverse proxy unique
- **Stratégie de bascule DB** : `pg_dump` / `pg_restore` en maintenance window, **pas** de réplication logique
