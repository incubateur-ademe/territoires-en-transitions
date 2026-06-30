-- Revert tet:collectivite/bucket_rls_visiteur_read from pg

BEGIN;

-- Helper : vrai si l'utilisateur courant a une adresse @ademe.fr. Le rôle
-- plateforme ADEME (cf. permission.models.ts) donne un accès en lecture aux
-- documents de toutes les collectivités.
create or replace function
    is_ademe()
    returns boolean
    stable
as
$$
select coalesce(d.email like '%@ademe.fr', false)
from dcp d
where d.user_id = auth.uid()
$$ language sql;
comment on function is_ademe is
    'Vrai si l''utilisateur courant a une adresse email @ademe.fr (rôle plateforme ADEME).';


drop policy if exists allow_read on storage.objects;
create policy allow_read
    on storage.objects for select
    using (is_bucket_writer(bucket_id) or is_ademe());

drop function if exists is_bucket_reader(text);

do $$
begin
    if to_regclass('public.labellisation_preuve_fichier') is not null then
        execute 'drop policy if exists allow_read on public.labellisation_preuve_fichier';
        execute $policy$
            create policy allow_read
                on public.labellisation_preuve_fichier for select
                using (have_lecture_acces(collectivite_id) or is_ademe())
        $policy$;
    end if;
end
$$;

COMMIT;
