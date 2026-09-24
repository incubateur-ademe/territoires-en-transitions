-- Deploy tet:collectivite/preuve_rls_insert_serveur to pg
-- requires: collectivite/bucket_rls_membre_read

BEGIN;

-- Referme le dépôt d'un document d'audit et d'un rapport de visite sur le
-- serveur. Le client n'écrit plus dans ces deux tables : les routeurs
-- addAuditDocument et addRapportVisite ont pris le relais et vérifient ce que
-- la RLS ne voyait pas, à commencer par l'appartenance du fichier à la
-- collectivité. Tant que PostgREST acceptait l'insertion directe, un client
-- pouvait continuer à s'en passer.
--
-- Une policy restrictive plutôt que la suppression de allow_insert : une table
-- sans policy d'insertion se lit comme un oubli, et une permissive
-- with check (false) ne bloquerait plus dès qu'une autre permissive serait
-- ajoutée à côté.
create policy deny_insert_client
    on preuve_audit as restrictive for insert
    to anon, authenticated
    with check (false);

create policy deny_insert_client
    on preuve_rapport as restrictive for insert
    to anon, authenticated
    with check (false);

COMMIT;
