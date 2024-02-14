-- Deploy tet:labellisation/audit to pg
BEGIN;

alter table labellisation.audit
    drop constraint if exists audit_en_attente;
alter table labellisation.audit
    drop constraint if exists audit_existant;

drop trigger after_write_update_audit_scores on labellisation.audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_scores;
drop function labellisation.update_audit_score_on_personnalisation;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function labellisation.audit_evaluation_payload(labellisation.audit, boolean, referentiel out jsonb, statuts out jsonb, consequences out jsonb);


alter table labellisation.audit
    add column date_cnl timestamp with time zone,
    add column valide_labellisation boolean,
    add column clos boolean default false not null;
comment on column labellisation.audit.date_cnl is 'Date de la CNL';
comment on column labellisation.audit.valide_labellisation is 'Validation de la labellisation après la CNL';
comment on column labellisation.audit.clos is 'Vrai si l''audit est terminé ou abandonné';

create or replace function labellisation.update_audit() returns trigger
    security definer
    language plpgsql
as
$$
begin
    -- Si l'audit passe en 'validé'
    if new.valide and not old.valide
    then -- alors on ajoute une date de fin
        new.date_fin = now();
        -- Si l'audit fait suite à une demande seulement cot
        if new.demande_id is null or
           (select sujet = 'cot' from labellisation.demande ld where ld.id = new.demande_id)
        then -- alors on termine l'audit
            new.clos = true;
        end if;
    end if;

    -- Si la labellisation passe en 'validé'
    if new.demande_id is not null and
       (select sujet in ('labellisation', 'labellisation_cot')
        from labellisation.demande ld
        where ld.id = new.demande_id) and
       new.valide_labellisation = true and (old.valide_labellisation is null or not old.valide_labellisation)
    then -- alors on termine l'audit
        new.clos = true;
    end if;

    return new;
end ;
$$;

create or replace function labellisation.current_audit(col integer, ref referentiel) returns labellisation.audit
    security definer
    language plpgsql
as
$$
    # variable_conflict use_column
declare
    found labellisation.audit;
begin
    select *
    into found
    from labellisation.audit a
    where a.collectivite_id = current_audit.col
      and a.referentiel = current_audit.ref
      and not a.clos
    limit 1;

    if found is null
        -- si l'audit n'existe pas.
    then
        insert
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        on conflict (collectivite_id, referentiel) where (not clos) do nothing
        returning * into found; -- null en cas de conflit
    end if;

    if found is null
        -- l'audit n'existait pas et n'a pas pu être créé
        -- car il vient d'être créé dans un autre appel
    then
        select *
        into found
        from labellisation.audit a
        where a.collectivite_id = current_audit.col
          and a.referentiel = current_audit.ref
          and not a.clos
        limit 1;
    end if;

    return found;
end;
$$;

create or replace function labellisation.active_audit(collectivite_id integer, referentiel referentiel) returns labellisation.audit
    language sql
BEGIN ATOMIC
SELECT a.id,
       a.collectivite_id,
       a.referentiel,
       a.demande_id,
       a.date_debut,
       a.date_fin,
       a.valide,
       a.date_cnl,
       a.valide_labellisation,
       a.clos
FROM labellisation.audit a
WHERE a.collectivite_id = active_audit.collectivite_id
  AND a.referentiel = active_audit.referentiel
  AND NOT a.clos
  AND a.date_debut IS NOT NULL
;
END;


create or replace function
    labellisation.audit_evaluation_payload(
    in audit labellisation.audit,
    in pre_audit boolean,
    in labellisation boolean,
    out referentiel jsonb,
    out statuts jsonb,
    out consequences jsonb
)
    stable
begin
    atomic
    with statuts as (select labellisation.json_action_statuts_at(
                                    audit.collectivite_id,
                                    audit.referentiel,
                                    case
                                        when pre_audit then audit.date_debut
                                        when labellisation then audit.date_cnl
                                        else audit.date_fin
                                        end
                            ) as data)
    select r.data                                    as referentiel,
           coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
           -- On n'utilise pas les conséquences de personnalisation
           -- elles sont calculées à chaque fois.
           '{}'::jsonb                               as consequences
    from evaluation.service_referentiel as r
             left join statuts s on true
    where r.referentiel = audit.referentiel;
end;

create or replace function labellisation.audit_personnalisation_payload(audit_id integer, pre_audit boolean, scores_table text) returns jsonb
    language sql
BEGIN ATOMIC
WITH la AS (
    SELECT audit.id,
           audit.collectivite_id,
           audit.referentiel,
           audit.demande_id,
           audit.date_debut,
           audit.date_fin,
           audit.valide,
           audit.date_cnl,
           audit.valide_labellisation,
           audit.clos,
           demande.sujet
    FROM labellisation.audit
             LEFT JOIN labellisation.demande on audit.demande_id = demande.id
    WHERE (audit.id = audit_personnalisation_payload.audit_id)
), evaluation_payload AS (
    SELECT transaction_timestamp() AS "timestamp",
           audit_personnalisation_payload.audit_id AS audit_id,
           la.collectivite_id,
           la.referentiel,
           audit_personnalisation_payload.scores_table AS scores_table,
           to_jsonb(ep.*) AS payload
    FROM (la
        JOIN LATERAL labellisation.audit_evaluation_payload(
                ROW(
                    la.id,
                    la.collectivite_id,
                    la.referentiel,
                    la.demande_id,
                    la.date_debut,
                    la.date_fin,
                    la.valide,
                    la.date_cnl,
                    la.valide_labellisation,
                    la.clos),
                audit_personnalisation_payload.pre_audit,
                (la.sujet is not null and la.sujet in ('labellisation', 'labellisation_cot'))
                     ) ep(referentiel, statuts, consequences) ON (true))
), personnalisation_payload AS (
    SELECT transaction_timestamp() AS "timestamp",
           la.collectivite_id,
           ''::text AS consequences_table,
           jsonb_build_object(
                   'identite',
                   ( SELECT evaluation.identite(la.collectivite_id) AS identite),
                   'regles',
                   ( SELECT evaluation.service_regles() AS service_regles),
                   'reponses',
                   ( SELECT labellisation.json_reponses_at(
                                    la.collectivite_id,
                                    CASE
                                        WHEN audit_personnalisation_payload.pre_audit THEN la.date_debut
                                        WHEN (la.sujet is not null and
                                              la.sujet in ('labellisation', 'labellisation_cot')) THEN
                                            la.date_cnl
                                        ELSE la.date_fin
                                        END
                            ) AS json_reponses_at
                   )
           ) AS payload,
           ( SELECT array_agg(ep.*) AS array_agg
             FROM evaluation_payload ep) AS evaluation_payloads
    FROM la
)
SELECT to_jsonb(pp.*) AS to_jsonb
FROM personnalisation_payload pp;
END;


create or replace function labellisation.evaluate_audit_statuts(audit_id integer, pre_audit boolean, scores_table character varying, OUT request_id bigint) returns bigint
    security definer
    language sql
BEGIN ATOMIC
SELECT post.post
FROM ((evaluation.current_service_configuration() conf(evaluation_endpoint, personnalisation_endpoint, created_at)
    JOIN labellisation.audit_personnalisation_payload(evaluate_audit_statuts.audit_id, evaluate_audit_statuts.pre_audit, (evaluate_audit_statuts.scores_table)::text) pp(pp) ON (true))
    JOIN LATERAL net.http_post((conf.personnalisation_endpoint)::text, pp.pp) post(post) ON (true))
WHERE (conf.* IS NOT NULL);
END;

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

create or replace view audit_en_cours (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT a.id,
       a.collectivite_id,
       a.referentiel,
       a.demande_id,
       a.date_debut,
       a.date_fin,
       a.valide
FROM labellisation.audit a
WHERE now() >= a.date_debut AND not a.clos
  AND est_verifie();

create or replace view audit (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT audit.id,
       audit.collectivite_id,
       audit.referentiel,
       audit.demande_id,
       audit.date_debut,
       audit.date_fin,
       audit.valide,
       audit.date_cnl,
       audit.valide_labellisation,
       audit.clos
FROM labellisation.audit
WHERE is_authenticated()
   OR is_service_role();

create function labellisation_validate_audit(
    audit_id integer,
    valide boolean
) returns void
    language plpgsql
    security definer
as
$$
begin
    if not est_auditeur_audit(audit_id) then
        perform set_config('response.status', '401', true);
        raise 'Seul l''auditeur peut valider l''audit.';
    end if;

    if valide is not null then
        update labellisation.audit
        set valide = labellisation_validate_audit.valide
        where id = labellisation_validate_audit.audit_id;
    end if;

end
$$;

create unique index audit_existant on labellisation.audit (collectivite_id, referentiel) where (not clos);


COMMIT;
