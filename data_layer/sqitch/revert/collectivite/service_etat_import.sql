-- Revert tet:collectivite/service_etat_import from pg

BEGIN;

-- Rien à défaire, et c'est délibéré.
--
-- Ce change ne crée aucune structure : il peuple des lignes de `collectivite`.
-- Les supprimer emporterait en cascade les rattachements des agents
-- (`private_utilisateur_droit`, `private_collectivite_membre`), leur bucket de
-- documents et les demandes d'avis déjà adressées à ces services — pour défaire
-- un import de données de référence. Le remède serait pire que le mal.
--
-- Pour repartir de zéro en local, `make db-reset` détruit le volume. Pour
-- corriger la liste, régénérer les CSV et déployer un nouveau change : voir
-- data_layer/seed/sources/service-etat/README.md.

COMMIT;
