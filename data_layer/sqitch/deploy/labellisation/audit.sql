-- Deploy tet:labellisation/audit to pg
BEGIN;

-- Statuts possibles pour audit
create type audit_statut as enum ('non audite', 'en cours', 'audite');

-- Table audit
create table audit
(
    id              serial                      primary key,
    collectivite_id integer                     references collectivite     not null,
    referentiel     referentiel                                             not null,
    demande_id      integer                     references labellisation.demande,
    auditeur        uuid                        references auth.users,
    date_debut      timestamp with time zone    default CURRENT_TIMESTAMP   not null,
    date_fin        timestamp with time zone    default CURRENT_TIMESTAMP,
    statut          audit_statut                default 'en cours'          not null
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
    statut          audit_statut                                        default 'non audite'        not null
);

/*
 Récupère l'audit en cours pour une collectivité et un référentiel
 Paramètres :
    col             collectivite.id
    ref             referentiel
 */
create function get_current_audit(col integer, ref referentiel)
    returns integer as
$$
select a.id
from audit a
where a.collectivite_id = col
  and a.referentiel = ref
  and a.statut = 'en cours'
order by date_debut desc
limit 1
$$ language sql;

/*
 Renseigne action_audit_state.audit_id si l'attribut est null
 Paramètres :
    aas          action_audit_state
 Exception :
    S'il n'y a pas d'audit existant
 */
create function set_audit_id()
    returns trigger as $$
begin
    if new.audit_id is null then
        new.audit_id = get_current_audit(
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
        return new;
    end if;
end;
$$ language plpgsql;

-- Trigger à l'insertion, renseigne audit_id s'il est null
create trigger get_audit_id
    before insert
    on action_audit_state
    for each row
execute procedure set_audit_id();

-- Trigger à la modification, change l'attribut modified_at
create trigger set_modified_at
    before update
    on action_audit_state
    for each row
execute procedure update_modified_at();

-- Vue get_action_audit_state_list
create view get_action_audit_state_list
as
select
    ar.id as action_id,
    aas.id as state_id,
    aas.statut as state_statut,
    aas.avis as state_avis,
    aas.ordre_du_jour as state_ordre_du_jour,
    a.id as audit_id,
    a.collectivite_id as collectivite_id,
    a.referentiel as referentiel
from action_relation ar
left join action_audit_state aas on ar.id = aas.action_id
join audit a on aas.audit_id = a.id;

-- TODO permissions

COMMIT;