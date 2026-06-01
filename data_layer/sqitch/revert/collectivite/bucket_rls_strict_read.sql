-- Revert tet:collectivite/bucket_rls_strict_read from pg

BEGIN;

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
