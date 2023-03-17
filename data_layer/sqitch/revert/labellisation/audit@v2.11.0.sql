-- Deploy tet:labellisation/audit to pg
BEGIN;

alter table audit
    drop constraint audit_existant,
    add constraint audit_existant exclude using GIST (
        -- Audit unique pour une collectivité, un référentiel, et une période de temps
        collectivite_id with =,
        referentiel with =,
        tstzrange(date_debut, date_fin) with &&
        );
alter table audit drop constraint audit_en_attente;

create or replace function
    labellisation.update_audit()
    returns trigger
as
$$
begin
    -- si l'utilisateur n'est ni éditeur ni service
    if not (have_edition_acces(new.collectivite_id) or is_service_role())
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- si la collectivité est COT
    -- et que l'audit n'est pas dans le cadre d'une demande de labellisation
    -- et que l'audit passe en 'validé'
    if (new.collectivite_id in (select collectivite_id from cot)
        and new.demande_id is null
        and new.valide
        and not old.valide)
    then -- alors on termine l'audit
        new.date_fin = now();
    end if;

    return new;
end ;
$$ language plpgsql;

create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns audit as
$$
select *
from audit_en_cours a
where a.collectivite_id = col
  and a.referentiel = ref
order by date_debut desc
limit 1
$$ language sql;

drop function labellisation_commencer_audit;

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

COMMIT;
