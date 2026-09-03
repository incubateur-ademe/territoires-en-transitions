-- Revert tet:labellisation/bibliotheque_fichier_not_null from pg

BEGIN;

alter table labellisation.bibliotheque_fichier
    alter column collectivite_id drop not null,
    alter column hash drop not null,
    alter column filename drop not null;

COMMIT;
