-- Deploy tet:collectivite/bucket_rls_strict_read to pg
-- requires: collectivite/bucket

BEGIN;

-- Restreint la lecture des objets de stockage aux membres (ou auditeurs) de
-- la collectivité propriétaire du bucket. Auparavant, tout utilisateur
-- authentifié pouvait télécharger n'importe quel objet à partir de son chemin.
-- Pentest V5 / OWASP A01:2021.
drop policy if exists allow_read on storage.objects;
create policy allow_read
    on storage.objects for select
    using (is_bucket_writer(bucket_id));

-- Idem sur la table héritée labellisation_preuve_fichier si elle existe
-- encore : la lecture des métadonnées (file_id, demande_id) doit être
-- restreinte à la collectivité.
do $$
begin
    if to_regclass('public.labellisation_preuve_fichier') is not null then
        execute 'drop policy if exists allow_read on public.labellisation_preuve_fichier';
        execute $policy$
            create policy allow_read
                on public.labellisation_preuve_fichier for select
                using (have_lecture_acces(collectivite_id))
        $policy$;
    end if;
end
$$;

COMMIT;
