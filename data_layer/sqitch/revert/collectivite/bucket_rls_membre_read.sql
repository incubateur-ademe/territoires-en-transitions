-- Revert tet:collectivite/bucket_rls_membre_read from pg

BEGIN;

-- Rouvre la lecture à tout compte authentifié, l'état que
-- bucket_rls_visiteur_read avait laissé. `is_ademe()` n'est pas recréée :
-- elle a été supprimée par ce même changement et rien ne la référence.
drop policy if exists allow_read on storage.objects;
create policy allow_read
    on storage.objects for select
    using (is_authenticated());

do $$
begin
    if to_regclass('public.labellisation_preuve_fichier') is not null then
        execute 'drop policy if exists allow_read on public.labellisation_preuve_fichier';
        execute $policy$
            create policy allow_read
                on public.labellisation_preuve_fichier for select
                using (is_authenticated())
        $policy$;
    end if;
end
$$;

COMMIT;
