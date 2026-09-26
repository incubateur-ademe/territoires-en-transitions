# Cibles utilitaires pour l'environnement preprod.
# Toutes les commandes s'exécutent depuis ce dossier (infra/preprod/).

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c

.DEFAULT_GOAL := help
.PHONY: help bootstrap-supabase-auth-roles-sql

help:
	@echo "Cibles disponibles :"
	@echo "  bootstrap-supabase-auth-roles-sql    Exécute supabase-api/sql/001-bootstrap-auth-roles.sql sur la RDB preprod."
	@echo "                        À lancer une fois après 'terraform apply' qui aura créé"
	@echo "                        le rôle supabase_auth_admin via l'API Scaleway."
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
