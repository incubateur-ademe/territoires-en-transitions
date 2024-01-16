-- Deploy tet:indicateur/confidentialite to pg

BEGIN;

alter view indicateurs set (security_invoker = on);
drop policy allow_read on indicateur_resultat_import;
create policy allow_read on indicateur_resultat_import
    as permissive
    for select
    using (can_read_acces_restreint(collectivite_id));

COMMIT;
