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

create trigger update_labellisation_after_scores
    after insert or update
    on post_audit_scores
    for each row
execute procedure labellisation.update_labellisation_after_scores();

create or replace function labellisation.update_audit_score_on_personnalisation() returns trigger
    language plpgsql
as
$$
begin
    perform (
        with
            ref as (
                select unnest(enum_range(null::referentiel)) as referentiel
            ),
            audit as (
                select ca.id
                from ref
                         join labellisation.current_audit(new.collectivite_id, ref.referentiel) ca on true
            ),
            query as (
                select labellisation.evaluate_audit_statuts(audit.id, true, 'pre_audit_scores') as id
                from audit
            )
        select count(query)
        from query
    );
    return new;
exception
    when others then return new;
end
$$;

create or replace function labellisation.update_audit_scores() returns trigger
    language plpgsql
as
$$
begin
    perform labellisation.evaluate_audit_statuts(new.id, true, 'pre_audit_scores');
    if new.date_fin is not null then
        perform labellisation.evaluate_audit_statuts(new.id, false, 'post_audit_scores');
    end if;
    return new;
end
$$;

create trigger after_write_update_audit_scores
    after insert or update
    on personnalisation_consequence
    for each row
execute procedure labellisation.update_audit_score_on_personnalisation();

create trigger after_write_update_audit_scores
    after insert or update
    on labellisation.audit
    for each row
execute procedure labellisation.update_audit_scores();

COMMIT;
