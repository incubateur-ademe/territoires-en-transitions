-- Deploy tet:labellisation/audit to pg
BEGIN;

-- Statuts possibles pour audit
create type audit_statut as enum ('non_audite', 'en_cours', 'audite');

-- Extension pour avoir des fonctions supplémentaires pour gist
create extension if not exists btree_gist;

-- Table audit
create table audit
(
    id              serial primary key,
    collectivite_id integer references collectivite                    not null,
    referentiel     referentiel                                        not null,
    demande_id      integer references labellisation.demande,
    auditeur        uuid references auth.users,
    date_debut      timestamp with time zone default CURRENT_TIMESTAMP not null,
    date_fin        timestamp with time zone,
    constraint audit_existant exclude using GIST (
        -- Audit unique pour une collectivité, un référentiel, et une période de temps
        collectivite_id with =,
        referentiel with =,
        tstzrange(date_debut, date_fin) with &&
    )
);
comment on table audit is
    'Les audits par collectivité.';

-- Table action_audit_state
create table labellisation.action_audit_state
(
    id              serial primary key,
    audit_id        integer references audit,
    action_id       action_id references action_relation                      not null,
    collectivite_id integer references collectivite                      not null,
    modified_by     uuid references auth.users default auth.uid()        not null,
    modified_at     timestamp with time zone   default CURRENT_TIMESTAMP not null,
    ordre_du_jour   boolean                    default false             not null,
    avis            text                       default ''                not null,
    statut          audit_statut               default 'non_audite'      not null
);

/*
 Récupère l'audit en cours pour une collectivité et un référentiel
 Paramètres :
    col             collectivite.id
    ref             referentiel
 */
create function labellisation.current_audit(col integer, ref referentiel)
    returns audit as
$$
select *
from audit a
where a.collectivite_id = col
  and a.referentiel = ref
  and (
        (a.date_fin is null and now() >= a.date_debut)
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


-- Trigger à la modification, change l'attribut modified_at
create trigger set_modified_at
    before update
    on labellisation.action_audit_state
    for each row
execute procedure update_modified_at();

-- Vue get_action_audit_state
create view public.action_audit_state
as
with action as (select ar.action_id
                from action_hierarchy ar
                where ar.type = 'action')
select ar.action_id      as action_id,
       aas.id            as state_id,
       aas.statut        as statut,
       aas.avis          as avis,
       aas.ordre_du_jour as ordre_du_jour,
       a.id              as audit_id,
       a.collectivite_id as collectivite_id,
       a.referentiel     as referentiel
from action ar
         left join labellisation.action_audit_state aas on ar.action_id = aas.action_id
         join audit a on aas.audit_id = a.id;
comment on view action_audit_state is
    'L''état d''audit d''une action.';


create function labellisation.upsert_action_audit()
    returns trigger as
$$
declare
    found_audit          audit;
    existing_audit_state labellisation.action_audit_state;

begin
    if not have_edition_acces(new.collectivite_id)
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    found_audit = labellisation.current_audit(
            new.collectivite_id,
            (select ar.referentiel
             from action_relation ar
             where ar.id = new.action_id)
        );

    if found_audit is null
    then
        raise 'Pas d''audit en cours.';
    end if;

    if found_audit.auditeur != auth.uid()
    then
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''est pas auditeur sur l''audit de la collectivité.';
    end if;

    select *
    from labellisation.action_audit_state
    where audit_id = found_audit.id
      and collectivite_id = new.collectivite_id
      and action_id = new.action_id
    into existing_audit_state;

    if existing_audit_state is null
    then
        insert into labellisation.action_audit_state (audit_id, action_id, collectivite_id, avis, ordre_du_jour, statut)
        values (found_audit.id, new.action_id, new.collectivite_id, coalesce(new.avis, ''), new.ordre_du_jour, new.statut);
    else
        update labellisation.action_audit_state
        set avis          = coalesce(new.avis, ''),
            ordre_du_jour = new.ordre_du_jour,
            statut        = new.statut
        where id = existing_audit_state.id;
    end if;

    return new;
end;
$$ language plpgsql security definer;


create trigger upsert
    instead of insert
    on public.action_audit_state
    for each row
execute procedure labellisation.upsert_action_audit();

alter table audit enable row level security;

create policy allow_read
    on audit
    for select
    using(is_authenticated());

create policy allow_insert
    on audit
    for insert
    with check(have_edition_acces(collectivite_id));

create policy allow_update
    on audit
    for update
    using(have_edition_acces(collectivite_id));

COMMIT;
