# Cibles utilitaires pour la stack prod (à lancer depuis infra/prod).

.DEFAULT_GOAL := help
.PHONY: help restore-prod-db

help:
	@echo "Cibles disponibles :"
	@echo "  restore-prod-db d=<dump> [list=true]"
	@echo "                        Bascule : remplace la base prod Scaleway par un dump complet"
	@echo "                        de Supabase Cloud, sans anonymisation. list=true : tri du"
	@echo "                        dump seulement. Runbook : infra/README.md « Bascule de production »."
	@echo ""
	@echo "Prérequis : psql et pg_restore 15+, terraform output disponible,"
	@echo "et IP du poste dans pg_allowed_ips (terraform.tfvars)."

# Export plutôt qu'interpolation shell : d peut contenir des espaces.
restore-prod-db: export DUMP = $(d)
restore-prod-db: export LIST_ONLY = $(if $(list),true,false)
restore-prod-db: export TARGET = prod
restore-prod-db:
	@test -n "$(d)" || { echo "Usage : make restore-prod-db d=backup-AAAA-MM-JJ.dump [list=true]"; exit 1; }
	@../scripts/restore-db.sh
