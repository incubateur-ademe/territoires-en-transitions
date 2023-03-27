-- Deploy tet:labellisation/audit to pg
BEGIN;

drop view public.audit;
alter table labellisation.audit
    set schema public;

alter table audit_auditeur
    drop column created_at;

create or replace function
    labellisation.update_audit()
    returns trigger
    security definer
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

drop function labellisation_commencer_audit(integer, timestamptz);

create function
    labellisation_commencer_audit(audit_id integer)
    returns audit
begin
    atomic
    update audit
    set date_debut = now()
    where id = audit_id
      and (id in (select aa.audit_id from audit_auditeur aa where aa.auditeur = auth.uid()) or is_service_role())
    returning *;
end;

COMMIT;
