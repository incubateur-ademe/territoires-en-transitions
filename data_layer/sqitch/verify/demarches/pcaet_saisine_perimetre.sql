-- Verify tet:demarches/pcaet_saisine_perimetre on pg

BEGIN;

-- La colonne et son domaine de valeurs.
SELECT perimetre
  FROM public.demarche_pcaet_demande_avis
 WHERE false;

DO $$
begin
    if not exists (
        select 1
          from pg_constraint
         where conname = 'demarche_pcaet_demande_avis_perimetre_connu'
           and conrelid = 'public.demarche_pcaet_demande_avis'::regclass
    ) then
        raise exception 'la contrainte demarche_pcaet_demande_avis_perimetre_connu est absente';
    end if;

    -- Le défaut porte tout le caractère rétrocompatible du change : sans lui, les
    -- saisines déjà en base seraient refusées par le NOT NULL.
    if (
        select column_default
          from information_schema.columns
         where table_schema = 'public'
           and table_name = 'demarche_pcaet_demande_avis'
           and column_name = 'perimetre'
    ) is distinct from '''principal''::text' then
        raise exception 'la colonne perimetre doit valoir principal par défaut';
    end if;
end
$$;

DO $$
begin
    if not exists (select 1 from public.demarche_pcaet_demande_avis) then
        return;
    end if;

    -- Une saisine secondaire ne se comprend que face à un périmètre secondaire de
    -- la déposante. L'inverse — une saisine secondaire sans territoire qui la
    -- justifie — signalerait une qualification écrite à tort.
    if exists (
        select 1
          from public.demarche_pcaet_demande_avis as demande
          join public.demarche on demarche.id = demande.demarche_id
         where demande.perimetre = 'secondaire'
           and not exists (
                select 1
                  from public.collectivite_perimetre_secondaire as perimetre
                 where perimetre.collectivite_id = demarche.collectivite_id
               )
    ) then
        raise exception
            'une saisine est marquée secondaire alors que la déposante ne porte aucun périmètre secondaire';
    end if;
end
$$;

ROLLBACK;
