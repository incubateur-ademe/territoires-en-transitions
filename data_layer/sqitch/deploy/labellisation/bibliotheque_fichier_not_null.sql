-- Deploy tet:labellisation/bibliotheque_fichier_not_null to pg

BEGIN;

alter table labellisation.bibliotheque_fichier
    alter column collectivite_id set not null,
    alter column hash set not null,
    alter column filename set not null;

COMMIT;
