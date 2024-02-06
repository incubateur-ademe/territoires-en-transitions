-- Deploy tet:labellisation/audit to pg
BEGIN;

drop function update_audit_date_cnl;
drop function update_audit_validation_labellisation;
drop view retool_preuves;
drop view preuve;
drop view audit;
drop trigger update_labellisation_after_scores on post_audit_scores;
drop function labellisation.update_labellisation_after_scores;
drop trigger after_write_update_audit_scores on labellisation.audit;
drop trigger after_write_update_audit_scores on personnalisation_consequence;
drop function labellisation.update_audit_scores;
drop function labellisation.update_audit_score_on_personnalisation;
drop function labellisation.evaluate_audit_statuts;
drop function labellisation.audit_personnalisation_payload;
drop function labellisation.audit_evaluation_payload;

create or replace view audit_en_cours (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT a.id,
       a.collectivite_id,
       a.referentiel,
       a.demande_id,
       a.date_debut,
       a.date_fin,
       a.valide
FROM labellisation.audit a
WHERE (a.date_fin IS NULL AND now() >= a.date_debut OR
       a.date_fin IS NOT NULL AND now() >= a.date_debut AND now() <= a.date_fin)
  AND est_verifie();

create or replace function labellisation.update_audit() returns trigger
    security definer
    language plpgsql
as
$$
begin
    -- si la collectivité est COT
    -- et que l'audit n'est pas dans le cadre d'une demande de labellisation
    -- et que l'audit passe en 'validé'
    if (new.collectivite_id in (select collectivite_id from cot)
        and
        (new.demande_id is null or (select sujet = 'cot' from labellisation.demande ld where ld.id = new.demande_id))
        and new.valide
        and not old.valide)
    then -- alors on termine l'audit
        new.date_fin = now();
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
      and now() <@ tstzrange(date_debut, date_fin)
    -- les audits avec une date de début sont prioritaires sur ceux avec une plage infinie,
    -- ces derniers comprenant toujours `now()`.
    order by date_debut desc nulls last
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
        on conflict do nothing
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
          and now() <@ tstzrange(date_debut, date_fin)
        order by date_debut desc nulls last
        limit 1;
    end if;

    return found;
end;
$$;

-- Enlève la dépendance des nouveaux attribut dans un premier temps pour éviter de drop la fonction
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
       null::timestamptz as date_cnl,
       null::boolean as valide_labellisation,
       false as clos
FROM labellisation.audit a
WHERE ((a.collectivite_id = active_audit.collectivite_id) AND (a.referentiel = active_audit.referentiel) AND (now() <@ tstzrange(a.date_debut, a.date_fin)) AND (a.date_debut IS NOT NULL));
END;

alter table labellisation.audit
    drop column date_cnl,
    drop column valide_labellisation,
    drop column clos;

create or replace function labellisation.active_audit(collectivite_id integer, referentiel referentiel) returns labellisation.audit
    language sql
BEGIN ATOMIC
SELECT a.id,
       a.collectivite_id,
       a.referentiel,
       a.demande_id,
       a.date_debut,
       a.date_fin,
       a.valide
FROM labellisation.audit a
WHERE ((a.collectivite_id = active_audit.collectivite_id) AND (a.referentiel = active_audit.referentiel) AND (now() <@ tstzrange(a.date_debut, a.date_fin)) AND (a.date_debut IS NOT NULL));
END;


create or replace function
    labellisation.audit_evaluation_payload(
    in audit labellisation.audit,
    in pre_audit boolean,
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
                                    case when pre_audit then audit.date_debut else audit.date_fin end
                            ) as data)
    select r.data                                    as referentiel,
           coalesce(s.data, to_jsonb('{}'::jsonb[])) as statuts,
           -- On n'utilise pas les conséquences de personnalisation
           -- elles sont calculées à chaque fois.
           to_jsonb('{}'::jsonb[])                   as consequences
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
           audit.valide
    FROM labellisation.audit
    WHERE (audit.id = audit_personnalisation_payload.audit_id)
), evaluation_payload AS (
    SELECT transaction_timestamp() AS "timestamp",
           audit_personnalisation_payload.audit_id AS audit_id,
           la.collectivite_id,
           la.referentiel,
           audit_personnalisation_payload.scores_table AS scores_table,
           to_jsonb(ep.*) AS payload
    FROM (la
        JOIN LATERAL labellisation.audit_evaluation_payload(ROW(la.id, la.collectivite_id, la.referentiel, la.demande_id, la.date_debut, la.date_fin, la.valide), audit_personnalisation_payload.pre_audit) ep(referentiel, statuts, consequences) ON (true))
), personnalisation_payload AS (
    SELECT transaction_timestamp() AS "timestamp",
           la.collectivite_id,
           ''::text AS consequences_table,
           jsonb_build_object('identite', ( SELECT evaluation.identite(la.collectivite_id) AS identite), 'regles', ( SELECT evaluation.service_regles() AS service_regles), 'reponses', ( SELECT labellisation.json_reponses_at(la.collectivite_id,
                                                                                                                                                                                                                                CASE
                                                                                                                                                                                                                                    WHEN audit_personnalisation_payload.pre_audit THEN la.date_debut
                                                                                                                                                                                                                                    ELSE la.date_fin
                                                                                                                                                                                                                                    END) AS json_reponses_at)) AS payload,
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

create or replace view audit (id, collectivite_id, referentiel, demande_id, date_debut, date_fin, valide) as
SELECT audit.id,
       audit.collectivite_id,
       audit.referentiel,
       audit.demande_id,
       audit.date_debut,
       audit.date_fin,
       audit.valide
FROM labellisation.audit
WHERE is_authenticated()
   OR is_service_role();

create view preuve
            (preuve_type, id, collectivite_id, fichier, lien, commentaire, created_at, created_by, created_by_nom,
             action, preuve_reglementaire, demande, rapport, audit)
as
SELECT 'complementaire'::preuve_type               AS preuve_type,
       pc.id,
       pc.collectivite_id,
       fs.snippet                                  AS fichier,
       pc.lien,
       pc.commentaire,
       pc.modified_at                              AS created_at,
       pc.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pc.modified_by) AS created_by_nom,
       snippet.snippet                             AS action,
       NULL::jsonb                                 AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM preuve_complementaire pc
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pc.fichier_id
         LEFT JOIN labellisation.action_snippet snippet
                   ON snippet.action_id::text = pc.action_id::text AND snippet.collectivite_id = pc.collectivite_id
WHERE can_read_acces_restreint(pc.collectivite_id)
UNION ALL
SELECT 'reglementaire'::preuve_type                AS preuve_type,
       pr.id,
       c.id                                        AS collectivite_id,
       fs.snippet                                  AS fichier,
       pr.lien,
       pr.commentaire,
       pr.modified_at                              AS created_at,
       pr.modified_by                              AS created_by,
       utilisateur.modified_by_nom(pr.modified_by) AS created_by_nom,
       snippet.snippet                             AS action,
       to_jsonb(prd.*)                             AS preuve_reglementaire,
       NULL::jsonb                                 AS demande,
       NULL::jsonb                                 AS rapport,
       NULL::jsonb                                 AS audit
FROM collectivite c
         LEFT JOIN preuve_reglementaire_definition prd ON true
         LEFT JOIN preuve_reglementaire pr ON prd.id::text = pr.preuve_id::text AND c.id = pr.collectivite_id
         LEFT JOIN preuve_action pa ON prd.id::text = pa.preuve_id::text
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = pr.fichier_id
         LEFT JOIN labellisation.action_snippet snippet
                   ON snippet.action_id::text = pa.action_id::text AND snippet.collectivite_id = c.id
WHERE can_read_acces_restreint(c.id)
UNION ALL
SELECT 'labellisation'::preuve_type               AS preuve_type,
       p.id,
       d.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       to_jsonb(d.*)                              AS demande,
       NULL::jsonb                                AS rapport,
       NULL::jsonb                                AS audit
FROM labellisation.demande d
         JOIN preuve_labellisation p ON p.demande_id = d.id
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(d.collectivite_id)
UNION ALL
SELECT 'rapport'::preuve_type                     AS preuve_type,
       p.id,
       p.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       NULL::jsonb                                AS demande,
       to_jsonb(p.*)                              AS rapport,
       NULL::jsonb                                AS audit
FROM preuve_rapport p
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(p.collectivite_id)
UNION ALL
SELECT 'audit'::preuve_type                       AS preuve_type,
       p.id,
       a.collectivite_id,
       fs.snippet                                 AS fichier,
       p.lien,
       p.commentaire,
       p.modified_at                              AS created_at,
       p.modified_by                              AS created_by,
       utilisateur.modified_by_nom(p.modified_by) AS created_by_nom,
       NULL::jsonb                                AS action,
       NULL::jsonb                                AS preuve_reglementaire,
       CASE
           WHEN d.id IS NOT NULL THEN to_jsonb(d.*)
           ELSE NULL::jsonb
           END                                    AS demande,
       NULL::jsonb                                AS rapport,
       to_jsonb(a.*)                              AS audit
FROM audit a
         JOIN preuve_audit p ON p.audit_id = a.id
         LEFT JOIN labellisation.demande d ON a.demande_id = d.id
         LEFT JOIN labellisation.bibliotheque_fichier_snippet fs ON fs.id = p.fichier_id
WHERE can_read_acces_restreint(a.collectivite_id);

create view retool_preuves (collectivite_id, nom, referentiel, action, preuve_type, fichier, lien, created_at) as
SELECT preuve.collectivite_id,
       nc.nom,
       preuve.action ->> 'referentiel'::text AS referentiel,
       preuve.action ->> 'identifiant'::text AS action,
       preuve.preuve_type,
       preuve.fichier ->> 'filename'::text   AS fichier,
       preuve.lien ->> 'url'::text           AS lien,
       preuve.created_at
FROM preuve
         JOIN named_collectivite nc ON nc.collectivite_id = preuve.collectivite_id AND preuve.created_at IS NOT NULL
WHERE (SELECT is_service_role() AS is_service_role)
ORDER BY preuve.collectivite_id, (preuve.action ->> 'referentiel'::text),
         (naturalsort(preuve.action ->> 'identifiant'::text));

COMMIT;
