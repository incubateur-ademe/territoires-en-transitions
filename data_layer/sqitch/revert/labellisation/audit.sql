-- Deploy tet:labellisation/audit to pg
BEGIN;

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

COMMIT;
