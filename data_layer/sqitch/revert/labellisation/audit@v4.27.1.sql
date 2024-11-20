-- Deploy tet:labellisation/audit to pg
BEGIN;

create or replace function labellisation.update_labellisation_after_scores() returns trigger
    language plpgsql
    security definer
as
$$
declare
    etoile integer;
begin
    select etoiles::text::integer
    from labellisation.demande d
             join labellisation.audit a on d.id = a.demande_id
    where a.id = new.audit_id
    limit 1
    into etoile;
    if
        -- Vérifie si la labellisation de l'audit a été validé
        (select a.valide_labellisation from labellisation.audit a where a.id = new.audit_id) and
            -- Vérifie si la labellisation n'existe pas déjà
        (select count(*)=0
         from labellisation l
         where l.collectivite_id = new.collectivite_id
           and l.referentiel = new.referentiel
           and l.etoiles = etoile)
    then
        with
            score AS (
                SELECT Round((case
                                  when (sc ->> 'point_potentiel'::text)::float= 0 then 0
                                  else (sc ->> 'point_fait'::text)::float / (sc ->> 'point_potentiel'::text)::float
                                  end * 100)::numeric, 1) as score_realise,
                       Round((case
                                  when (sc ->> 'point_potentiel'::text)::float = 0 then 0
                                  else (sc ->> 'point_programme'::text)::float / (sc ->> 'point_potentiel'::text)::float
                                  end * 100)::numeric, 1) as score_programme
                FROM jsonb_array_elements(new.scores) sc
                WHERE case when new.referentiel = 'eci'then
                               sc @> '{"action_id": "eci"}'::jsonb
                           else
                               sc @> '{"action_id": "cae"}'::jsonb
                          end
            )
        insert into labellisation (collectivite_id, referentiel, obtenue_le, etoiles, score_realise, score_programme)
        select new.collectivite_id, new.referentiel, now(), etoile, score.score_realise, score.score_programme
        from score
        on conflict (collectivite_id, annee, referentiel) do update
            set obtenue_le = excluded.obtenue_le,
                etoiles = excluded.etoiles,
                score_realise = excluded.score_realise,
                score_programme = excluded.score_programme;

    end if;
    return new;
end
$$;
comment on function labellisation.update_labellisation_after_scores is
    'Ajoute automatiquement la labellisation si cette dernière a été validé et n''existe pas déjà';

COMMIT;
