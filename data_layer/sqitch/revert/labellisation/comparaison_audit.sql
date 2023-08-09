-- Deploy tet:labellisation/comparaison_audit to pg

BEGIN;

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

COMMIT;
