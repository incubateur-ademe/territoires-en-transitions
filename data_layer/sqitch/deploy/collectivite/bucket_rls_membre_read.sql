-- Deploy tet:collectivite/bucket_rls_membre_read to pg
-- requires: collectivite/bucket_rls_visiteur_read

BEGIN;

-- Referme la lecture des objets de stockage sur les membres du bucket.
-- `is_authenticated()` la laissait à tout compte connecté : il suffisait de
-- connaître un bucket et une empreinte pour télécharger le document d'une
-- autre collectivité, confidentiel compris.
--
-- Le produit n'en dépend plus : le backend signe ses URL en service role,
-- donc hors RLS, et une URL signée reste consommable sans JWT utilisateur.
drop policy if exists allow_read on storage.objects;
create policy allow_read
    on storage.objects for select
    using (is_bucket_writer(bucket_id));

-- Idem sur la table héritée si elle existe encore : ses métadonnées
-- (file_id, demande_id) redeviennent réservées à la collectivité.
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
