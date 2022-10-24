-- Deploy tet:labellisation/audit to pg
BEGIN;

-- Statuts possibles pour audit
create type audit_statut as enum ('non_audite', 'en_cours', 'audite');

-- Table audit
create table audit
(
    id              serial                      primary key,
    collectivite_id integer                     references collectivite     not null,
    referentiel     referentiel                                             not null,
    demande_id      integer                     references labellisation.demande,
    auditeur        uuid                        references auth.users,
    date_debut      timestamp with time zone    default CURRENT_TIMESTAMP   not null,
    date_fin        timestamp with time zone
);

-- Table action_audit_state
create table action_audit_state
(
    id              serial                      primary key,
    audit_id        integer                     references audit,
    action_id       text                        references action_relation                          not null,
    collectivite_id integer                     references collectivite                             not null,
    modified_by     uuid                        references auth.users   default auth.uid()          not null,
    modified_at     timestamp with time zone                            default CURRENT_TIMESTAMP   not null,
    ordre_du_jour   boolean                                             default false               not null,
    avis            text,
    statut          audit_statut                                        default 'non_audite'        not null
);

/*
 Récupère l'audit en cours pour une collectivité et un référentiel
 Paramètres :
    col             collectivite.id
    ref             referentiel
 */
create function labellisation.current_audit(col integer, ref referentiel)
    returns integer as
$$
select a.id
from audit a
where a.collectivite_id = col
  and a.referentiel = ref
  and (
      (a.date_fin is null and now()>= a.date_debut)
    or (a.date_fin is not null and now() between a.date_debut and a.date_fin)
      )
order by date_debut desc
limit 1
$$ language sql;
comment on function labellisation.current_audit is
'Récupère l''audit en cours pour une collectivité et un référentiel
 Paramètres :
    col             collectivite.id
    ref             referentiel';

/*
 Renseigne action_audit_state.audit_id si l'attribut est null
 Paramètres :
    aas          action_audit_state
 Exception :
    S'il n'y a pas d'audit existant
 */
create function labellisation.audit_id()
    returns trigger as $$
begin
    if new.audit_id is null then
        new.audit_id = labellisation.current_audit(
                new.collectivite_id,
                (
                    select ar.referentiel
                    from action_relation ar
                    where ar.id = new.action_id
                )
            );
        if new.audit_id is null then
            raise exception 'Pas d audit en cours ou existant à rattacher';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;
comment on function labellisation.audit_id is
'
 Renseigne action_audit_state.audit_id si l''attribut est null
 Paramètres :
    aas          action_audit_state
 Exception :
    S''il n''y a pas d''audit existant';

-- Trigger à l'insertion, renseigne audit_id s'il est null
create trigger get_audit_id
    before insert
    on action_audit_state
    for each row
execute procedure labellisation.audit_id();

-- Trigger à la modification, change l'attribut modified_at
create trigger set_modified_at
    before update
    on action_audit_state
    for each row
execute procedure update_modified_at();

-- Vue get_action_audit_state_list
create view action_audit_state_list
as
with action as (
    select ar.action_id
    from action_hierarchy ar
    where ar.type = 'action'
)
select
    ar.action_id as action_id,
    aas.id as state_id,
    aas.statut as statut,
    aas.avis as avis,
    aas.ordre_du_jour as ordre_du_jour,
    a.id as audit_id,
    a.collectivite_id as collectivite_id,
    a.referentiel as referentiel
from action ar
left join action_audit_state aas on ar.action_id = aas.action_id
join audit a on aas.audit_id = a.id;


-- TODO permissions


COMMIT;