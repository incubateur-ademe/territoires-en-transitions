-- Deploy tet:labellisation/audit to pg
BEGIN;

-- On sort la vue du schema public.
alter table audit
    set schema labellisation;

create view public.audit as
select *
from labellisation.audit;

-- Permet aux RLS de la table de s'appliquer aux requêtes de la vue.
    alter view public.audit set (security_invoker = on);

alter table audit_auditeur
    add column created_at timestamptz default current_timestamp;
comment on column audit_auditeur.created_at is 'La date à laquelle l''auditeur est rattaché.';

create or replace function
    labellisation.update_audit()
    returns trigger
    security definer
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
$$ language plpgsql;


drop function labellisation_commencer_audit(integer);
create function labellisation_commencer_audit(
    audit_id integer,
    date_debut timestamptz default current_timestamp
)
    returns labellisation.audit
as
$$
declare
    audit labellisation.audit;
begin
    -- si l'utilisateur n'est ni auditeur ni service
    if not (audit_id in (select aa.audit_id from audit_auditeur aa where aa.auditeur = auth.uid()) or is_service_role())
    then -- alors on renvoie un code 403
        perform set_config('response.status', '403', true);
        raise 'L''utilisateur n''a pas de droit en édition sur la collectivité.';
    end if;

    -- si la demande est en cours
    if (select en_cours
        from audit a
                 join labellisation.demande d on a.demande_id = d.id
        where a.id = labellisation_commencer_audit.audit_id)
    then
        -- on renvoie un code 409 (conflict)
        perform set_config('response.status', '409', true);
        raise 'La demande liée à l''audit est en cours, elle n''a pas été envoyée.';
    end if;

    update labellisation.audit
    set date_debut = labellisation_commencer_audit.date_debut
    where id = audit_id
    returning * into audit;

    return audit;
end ;
$$ language plpgsql security definer;


create or replace function labellisation.current_audit(col integer, ref referentiel)
    returns labellisation.audit
    security definer
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
    then
        insert
        into labellisation.audit (collectivite_id, referentiel, demande_id, date_debut, date_fin)
        select current_audit.col,
               current_audit.ref,
               null,
               null,
               null
        returning * into found;
    end if;

    return found;
end;
$$ language plpgsql;

COMMIT;
