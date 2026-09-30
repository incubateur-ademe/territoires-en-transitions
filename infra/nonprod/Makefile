# Cibles utilitaires pour le tier nonprod (environnements preprod et staging).
# Toutes les commandes s'exécutent depuis ce dossier (infra/nonprod/).

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help
.PHONY: help bootstrap-supabase-auth-roles-sql bootstrap-supabase-roles-sql bootstrap-storage-sql

help:
	@echo "Cibles disponibles :"
	@echo "  bootstrap-supabase-auth-roles-sql    Exécute supabase-api/sql/001-bootstrap-auth-roles.sql sur la RDB preprod (managée)."
	@echo "                        À lancer une fois après 'terraform apply' qui aura créé"
	@echo "                        le rôle supabase_auth_admin via l'API Scaleway."
	@echo "  bootstrap-supabase-roles-sql         Exécute supabase-api/sql/002-bootstrap-supabase-roles.sql :"
	@echo "                        rôles anon / authenticated / service_role. AVANT la"
	@echo "                        restauration du dump Supabase, qui les référence."
	@echo "  bootstrap-storage-sql                Exécute supabase-api/sql/003-bootstrap-storage.sql :"
	@echo "                        propriété et droits du schéma storage. APRÈS la"
	@echo "                        restauration, et à rejouer après chaque démarrage de"
	@echo "                        Storage API qui a créé de nouvelles tables."
	@echo ""
	@echo "Prérequis : psql installé (brew install libpq), terraform output disponible,"
	@echo "et IP du poste dans pg_allowed_ips (terraform.tfvars)."

bootstrap-supabase-auth-roles-sql:
	@command -v psql >/dev/null 2>&1 || { \
		echo "Erreur : psql introuvable. Installer libpq :"; \
		echo "  brew install libpq && brew link --force libpq"; \
		exit 1; \
	}
	@test -f supabase-api/sql/001-bootstrap-auth-roles.sql || { \
		echo "Erreur : supabase-api/sql/001-bootstrap-auth-roles.sql introuvable depuis $$(pwd)"; \
		exit 1; \
	}
	@echo "Lecture des outputs Terraform..."; \
	pg_pwd=$$(terraform output -raw pg_admin_password); \
	pg_host=$$(terraform output -raw pg_endpoint_ip); \
	pg_port=$$(terraform output -raw pg_endpoint_port); \
	pg_user=$$(terraform output -raw pg_admin_user); \
	pg_dbname=$$(terraform output -raw pg_database_name); \
	auth_pwd=$$(terraform output -raw supabase_auth_admin_password); \
	pg_private_ip=$$(terraform output -raw pg_private_endpoint_ip); \
	echo "Connexion à $$pg_host:$$pg_port en tant que $$pg_user (dbname=$$pg_dbname)..."; \
	PGPASSWORD="$$pg_pwd" psql \
		"host=$$pg_host port=$$pg_port dbname=$$pg_dbname user=$$pg_user sslmode=require" \
		-f supabase-api/sql/001-bootstrap-auth-roles.sql; \
	echo ""; \
	echo "Bootstrap terminé."; \
	echo ""; \
	echo "DATABASE_URL pour GoTrue (utiliser l'IP privée du VPC dans Coolify) :"; \
	echo ""; \
	echo "    postgres://supabase_auth_admin:$$auth_pwd@$$pg_private_ip:$$pg_port/$$pg_dbname?sslmode=require&search_path=auth"; \
	echo ""; \
	echo "Le mot de passe est aussi disponible via :"; \
	echo "    terraform output -raw supabase_auth_admin_password"

# Exécute un fichier SQL en tet_admin sur l'endpoint public de la RDB preprod.
# $(1) : chemin du fichier SQL.
define run_admin_sql
	@command -v psql >/dev/null 2>&1 || { \
		echo "Erreur : psql introuvable. Installer libpq :"; \
		echo "  brew install libpq && brew link --force libpq"; \
		exit 1; \
	}
	@test -f $(1) || { echo "Erreur : $(1) introuvable depuis $$(pwd)"; exit 1; }
	@pg_pwd=$$(terraform output -raw pg_admin_password); \
	pg_host=$$(terraform output -raw pg_endpoint_ip); \
	pg_port=$$(terraform output -raw pg_endpoint_port); \
	pg_user=$$(terraform output -raw pg_admin_user); \
	pg_dbname=$$(terraform output -raw pg_database_name); \
	echo "Connexion à $$pg_host:$$pg_port en tant que $$pg_user (dbname=$$pg_dbname)..."; \
	PGPASSWORD="$$pg_pwd" psql \
		"host=$$pg_host port=$$pg_port dbname=$$pg_dbname user=$$pg_user sslmode=require" \
		-f $(1)
endef

bootstrap-supabase-roles-sql:
	$(call run_admin_sql,supabase-api/sql/002-bootstrap-supabase-roles.sql)

bootstrap-storage-sql:
	$(call run_admin_sql,supabase-api/sql/003-bootstrap-storage.sql)
	@storage_pwd=$$(terraform output -raw supabase_storage_admin_password); \
	pg_port=$$(terraform output -raw pg_endpoint_port); \
	pg_dbname=$$(terraform output -raw pg_database_name); \
	pg_private_ip=$$(terraform output -raw pg_private_endpoint_ip); \
	echo ""; \
	echo "STORAGE_DB_DATABASE_URL pour Storage API (IP privée du VPC, dans Coolify) :"; \
	echo ""; \
	echo "    postgres://supabase_storage_admin:$$storage_pwd@$$pg_private_ip:$$pg_port/$$pg_dbname?sslmode=require"
