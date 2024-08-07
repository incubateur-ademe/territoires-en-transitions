-- Deploy tet:labellisation/audit to pg
BEGIN;

-- Crée une table migration pour passer l'auditeur de la table audit à la table audit_auditeur
create table migration.audit
as
select *
from public.audit;


alter table audit
drop column auditeur;

-- Table audit_auditeur
create table audit_auditeur
(
    audit_id integer references audit not null,
    auditeur uuid references auth.users not null,
    primary key (audit_id, auditeur)
);

create or replace function labellisation.upsert_action_audit()
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

    if not (select bool_or(auth.uid() = auditeur) from audit_auditeur where audit_id=found_audit.id)
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
end
$$ language plpgsql security definer;

create or replace trigger upsert
    instead of insert
    on public.action_audit_state
    for each row
execute procedure labellisation.upsert_action_audit();

alter table audit_auditeur enable row level security;

create policy allow_read
    on audit_auditeur
    for select
    using(is_authenticated());

create policy allow_insert
    on audit_auditeur
    for insert
    with check(have_edition_acces((select a.collectivite_id
                                   from audit a
                                   where a.id = audit_id
                                   limit 1)));

create policy allow_update
    on audit_auditeur
    for update
    using(have_edition_acces((select a.collectivite_id
                              from audit a
                              where a.id = audit_id
                              limit 1)));


-- Passe l'auditeur de la table audit à la table audit_auditeur
insert into audit_auditeur (select id as audit_id, auditeur
                            from migration.audit
                            where auditeur is not null) ;


create or replace function est_auditeur(col integer) returns boolean as
$$
with
    ref as (select unnest(enum_range(null::referentiel)) as referentiel),
    audit_en_cours as (
        select aa.auditeur
        from ref
                 left join labellisation.current_audit(est_auditeur.col,ref.referentiel) a on true
                 left join audit_auditeur aa on a.id = aa.audit_id
    )
select coalesce(bool_or(auth.uid()=audit_en_cours.auditeur), false) from audit_en_cours;
$$ language sql;
comment on function est_auditeur is
    'Dit si l''utilisateur courant est auditeur sur une collectivité
     Paramètres :
        col             collectivite.id';

create or replace view collectivite_niveau_acces
as
with current_droits as (select *
                        from private_utilisateur_droit
                        where user_id = auth.uid()
                          and active)
select named_collectivite.collectivite_id,
       named_collectivite.nom,
       niveau_acces,
       est_auditeur(named_collectivite.collectivite_id) as est_auditeur
from named_collectivite
         left join current_droits on named_collectivite.collectivite_id = current_droits.collectivite_id
order by unaccent(nom);


create or replace view mes_collectivites
as
select *
from collectivite_niveau_acces
where niveau_acces is not null
order by unaccent(nom);

COMMIT;
