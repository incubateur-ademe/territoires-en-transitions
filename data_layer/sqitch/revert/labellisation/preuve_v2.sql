-- Deploy tet:labellisation/preuve_v2 to pg

BEGIN;

alter table preuve_audit
    drop constraint preuve_collectivite_id;

alter table preuve_complementaire
    drop constraint preuve_collectivite_id;

alter table preuve_labellisation
    drop constraint preuve_collectivite_id;

alter table preuve_rapport
    drop constraint preuve_collectivite_id;

alter table preuve_reglementaire
    drop constraint preuve_collectivite_id;

drop index preuve_audit_idx_collectivite;
drop index preuve_complementaire_idx_collectivite;
drop index preuve_labellisation_idx_collectivite;
drop index preuve_rapport_idx_collectivite;
drop index preuve_reglementaire_idx_collectivite;

COMMIT;
